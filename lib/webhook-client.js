import { getSetting } from './db.js';
import { sanitizeI2vPrompt } from './prompts.js';

// In-memory maps for transparent fallback redirection
const taskParamsMap = new Map();
const taskMapRedirects = new Map();

function isQuotaError(errorMessage) {
  if (!errorMessage) return false;
  const msg = errorMessage.toLowerCase();
  return msg.includes('quota') || msg.includes('limit') || msg.includes('exhausted') || msg.includes('429');
}

/**
 * Client for the local webhook API (Veo/Imagen generation)
 * Default: http://127.0.0.1:8765
 */

/**function getBaseUrl() {
 * const port = getSetting('webhook_port') || '8765';
  *return `http://127.0.0.1:${port}`;
}
*/

import { exec } from 'child_process';

function ensureGatewaySshTunnel() {
  if (process.env.NODE_ROLE === 'gateway') {
    try {
      exec("pgrep -f '8765:127.0.0.1:8765' || ssh -N -f -L 8765:127.0.0.1:8765 -o StrictHostKeyChecking=no -p 2222 vibe-server", () => {});
    } catch (_) {}
  }
}

function getBaseUrl() {
  const port = process.env.WEBHOOK_PORT || getSetting('webhook_port') || '8765';
  const host = process.env.WEBHOOK_HOST || getSetting('webhook_host') || '100.117.59.92';
  return `http://${host}:${port}`;
}

function getApiKey() {
  return getSetting('webhook_api_key') || '';
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': getApiKey(),
  };
}

/**
 * Apply random safety delay before sending requests to G-Labs to prevent Google Flow rate limits.
 */
async function applyRandomDelay() {
  const delayEnabled = getSetting('webhook_delay_enabled') !== null
    ? Number(getSetting('webhook_delay_enabled')) === 1
    : true; // Default to true if not set yet
  
  if (!delayEnabled) return;

  const minSetting = getSetting('webhook_delay_min');
  const maxSetting = getSetting('webhook_delay_max');

  const min = minSetting !== null ? parseInt(minSetting, 10) : 10;
  const max = maxSetting !== null ? parseInt(maxSetting, 10) : 20;

  if (isNaN(min) || isNaN(max) || min < 0 || max < min) {
    return;
  }

  if (max === 0) return;

  const seconds = Math.floor(Math.random() * (max - min + 1)) + min;
  if (seconds > 0) {
    console.info(`[Webhook Client] Safety delay active. Waiting ${seconds}s before submitting request to G-Labs...`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
}

/**
 * Check webhook server health
 */
export async function webhookHealth() {
  const res = await fetch(`${getBaseUrl()}/api/health`, { signal: AbortSignal.timeout(5000) });
  return res.json();
}

/**
 * Sanitize T2I prompt for Google Imagen/Flow compatibility.
 * Google Imagen does NOT support NEGATIVE PROMPT, Midjourney syntax (--ar, --no),
 * or LAYER tags. Redundant body-part descriptions and 'strictly' directives are
 * also stripped to avoid false positives from Google's safety filter.
 */
function sanitizeImagePrompt(prompt) {
  if (!prompt) return prompt;
  let cleaned = prompt;

  // 1. Strip NEGATIVE PROMPT section (everything after "NEGATIVE PROMPT:")
  cleaned = cleaned.replace(/\s*NEGATIVE PROMPT:.*$/i, '');

  // 2. Strip Midjourney syntax: --ar X:Y, --no XXXXX
  cleaned = cleaned.replace(/--ar\s+\d+:\d+/gi, '');
  cleaned = cleaned.replace(/--no\s+\S+/gi, '');

  // 3. Strip LAYER tags: [LAYER N: TEXT]
  cleaned = cleaned.replace(/\[LAYER\s+\d+:\s*[^\]]*\]/gi, '');

  // 4. Strip (VERTICAL 9:16) prefix
  cleaned = cleaned.replace(/\(VERTICAL\s+\d+:\d+\)/gi, '');

  // 5. Strip (Constraint: ...) tags
  cleaned = cleaned.replace(/\(Constraint:\s*[^)]*\)/gi, '');

  // 6. Strip parenthesized label prefixes: (Anchor:, (Wardrobe:, (Product Truth:, etc.
  //    but keep their content
  cleaned = cleaned.replace(/\((Anchor|Wardrobe|Product Truth|Environment|Lighting|Frozen Action|Micro-Expression|Texture|Shot on):\s*/gi, '(');

  // 7. Strip "strictly" directives — these are prompt-engineering artifacts, not visual descriptions
  cleaned = cleaned.replace(/,?\s*strictly\s+no\s+[^,)]+/gi, '');
  cleaned = cleaned.replace(/,?\s*strictly\s+\w+\s+\w+/gi, '');

  // 8. Strip repetitive body-part exclusion phrases that trigger safety filter
  cleaned = cleaned.replace(/,?\s*cropped from the elbow down to show only the forearms and hands/gi, '');
  cleaned = cleaned.replace(/,?\s*omitting the face,?\s*head,?\s*neck,?\s*chest,?\s*and shoulders/gi, '');
  cleaned = cleaned.replace(/,?\s*showcasing precise hand actions and movements/gi, '');

  // 9. Strip duplicate wardrobe description (appears twice in prompt — Anchor + Wardrobe sections)
  //    Keep only the first occurrence of the gamis description
  const gamisPattern = /wearing a modest loose-fitting gamis dress with long flowing sleeves covering the arms completely down to the wrists/gi;
  let gamisCount = 0;
  cleaned = cleaned.replace(gamisPattern, (match) => {
    gamisCount++;
    return gamisCount === 1 ? 'wearing a modest gamis dress with long sleeves' : '';
  });

  // 10. Clean up extra whitespace, commas, empty parens
  cleaned = cleaned.replace(/\(\s*\)/g, '');
  cleaned = cleaned.replace(/,\s*,/g, ',');
  cleaned = cleaned.replace(/,\s*\)/g, ')');
  cleaned = cleaned.replace(/\(\s*,/g, '(');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Submit image generation request
 */
export async function generateImage({ prompt, model, aspect_ratio, reference_images, upscale }) {
  await applyRandomDelay();
  const primaryModel = model || getSetting('webhook_image_model') || 'nano_banana_pro';
  const sanitizedPrompt = sanitizeImagePrompt(prompt);
  const body = {
    prompt: sanitizedPrompt,
    model: primaryModel,
    aspect_ratio: aspect_ratio || '9:16',
  };
  if (reference_images) body.reference_images = reference_images;
  if (upscale) body.upscale = Array.isArray(upscale) ? upscale : [upscale];

  let resData;
  try {
    const res = await fetch(`${getBaseUrl()}/api/image/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const errorMsg = err.error || err.message || `HTTP ${res.status}`;
      
      // Check for quota fallback on submission error
      if (primaryModel === 'nano_banana_pro' && isQuotaError(errorMsg)) {
        console.warn(`[Webhook Client] Submission of nano_banana_pro failed due to quota limit: ${errorMsg}. Trying fallback to nano_banana_2...`);
        return generateImage({ prompt, model: 'nano_banana_2', aspect_ratio, reference_images, upscale });
      }
      throw new Error(errorMsg);
    }
    resData = await res.json();
  } catch (error) {
    if (primaryModel === 'nano_banana_pro' && isQuotaError(error.message)) {
      console.warn(`[Webhook Client] Submission of nano_banana_pro failed with exception: ${error.message}. Trying fallback to nano_banana_2...`);
      return generateImage({ prompt, model: 'nano_banana_2', aspect_ratio, reference_images, upscale });
    }
    throw error;
  }

  // Save parameters to map for polling phase fallback
  if (resData?.task_id) {
    taskParamsMap.set(resData.task_id, { prompt, model: primaryModel, aspect_ratio, reference_images, upscale });
  }
  return resData;
}

/**
 * Submit video generation request
 */
export async function generateVideo({ prompt, model, aspect_ratio, mode, resolution, reference_images }) {
  await applyRandomDelay();
  const videoMode = mode || 'text_to_video';
  const finalPrompt = sanitizeI2vPrompt(prompt);

  const body = {
    prompt: finalPrompt,
    model: model || getSetting('webhook_video_model') || 'veo_31_lite',
    aspect_ratio: aspect_ratio || '9:16',
    mode: videoMode,
  };
  if (resolution) body.resolution = Array.isArray(resolution) ? resolution : [resolution];
  if (reference_images) body.reference_images = reference_images;

  const res = await fetch(`${getBaseUrl()}/api/video/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json(); // { task_id, status, poll_url }
}

/**
 * Check task status
 */
export async function getTaskStatus(taskId) {
  // Check if this task is redirected to a fallback task
  if (taskMapRedirects.has(taskId)) {
    const realTaskId = taskMapRedirects.get(taskId);
    console.log(`[Webhook Client] Redirecting getTaskStatus for ${taskId} to fallback task ${realTaskId}`);
    const realStatus = await getTaskStatus(realTaskId);
    if (realStatus) {
      // Retain original taskId so the caller's mapping remains intact
      realStatus.task_id = taskId;
    }
    return realStatus;
  }

  const res = await fetch(`${getBaseUrl()}/api/status/${taskId}`, {
    headers: getHeaders(),
  });
  const data = await res.json();

  // If task status is failed, check if it's due to daily quota exhaustion
  if (data?.status === 'failed') {
    const errorMsg = data.error || data.error_detail || data.message || '';
    if (isQuotaError(errorMsg)) {
      const params = taskParamsMap.get(taskId);
      if (params && params.model === 'nano_banana_pro') {
        console.warn(`[Webhook Client] Task ${taskId} failed due to quota limit: ${errorMsg}. Automatically retrying with fallback model nano_banana_2...`);
        // Remove from map to prevent looping
        taskParamsMap.delete(taskId);

        try {
          // Submit new task with fallback model
          const retryResult = await generateImage({
            prompt: params.prompt,
            model: 'nano_banana_2',
            aspect_ratio: params.aspect_ratio,
            reference_images: params.reference_images,
            upscale: params.upscale
          });

          if (retryResult?.task_id) {
            const newTaskId = retryResult.task_id;
            console.info(`[Webhook Client] Fallback task ${newTaskId} successfully submitted for failed task ${taskId}.`);
            taskMapRedirects.set(taskId, newTaskId);

            // Return pending state so the caller continues polling the same taskId
            return {
              task_id: taskId,
              status: 'pending',
              message: 'Retrying with fallback model nano_banana_2'
            };
          }
        } catch (retryErr) {
          console.error(`[Webhook Client] Failed to submit fallback task for ${taskId}:`, retryErr.message);
        }
      }
    }
  }

  return data;
}

/**
 * Get task result with file URLs
 */
export async function getTaskResult(taskId) {
  const res = await fetch(`${getBaseUrl()}/api/result/${taskId}`, {
    headers: getHeaders(),
  });
  return res.json();
}

/**
 * Get file download URL (no auth needed)
 */
export function getFileUrl(filename) {
  return `${getBaseUrl()}/api/files/${filename}`;
}

/**
 * List all tasks
 */
export async function listTasks() {
  const res = await fetch(`${getBaseUrl()}/api/tasks`, {
    headers: getHeaders(),
  });
  return res.json();
}
