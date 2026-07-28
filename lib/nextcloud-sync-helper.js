import { getDb, updateReCampaignItem, updatePillarCampaignItem, updateInstantCampaignItem } from './db.js';
import { getNextcloudClient, getOrCreatePublicShareLink } from './nextcloud-helper.js';
import {
  getCloudFolderPath,
  getCloudMasterFileName,
  getCloudVoFileName,
  getCloudThumbFileName,
  getCloudClipFileName
} from './cloud-naming-helper.js';
import fs from 'fs';
import path from 'path';

function getProductSlug(campaign, item = {}) {
  const rawProduct = item.nama_produk || item.product || campaign.product_name || campaign.campaign_name || 'umum';
  return rawProduct
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join('_');
}

function formatVideoId({ accountName, modulePrefix = 're', campaignId = '', sequence = 1, productSlug = 'umum' }) {
  const accountSlug = (accountName || 'umum')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');

  const modPrefix = (modulePrefix || 're').toLowerCase().trim();

  let campaignHash = '66b4d6';
  if (campaignId) {
    const cleanId = String(campaignId).replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (cleanId.length >= 6) {
      campaignHash = cleanId.substring(0, 6);
    } else {
      campaignHash = cleanId.padEnd(6, '0');
    }
  }

  const paddedSeq = String(sequence).padStart(2, '0');
  return `${accountSlug}_${modPrefix}_${productSlug}_${campaignHash}_${paddedSeq}`;
}

function getReBatchIdLocal(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM re_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  return formatVideoId({
    accountName: campaign.account_name || 'umum',
    modulePrefix: 're',
    campaignId: campaign.id,
    sequence: sequenceNumber,
    productSlug: getProductSlug(campaign, item)
  });
}

function getOpcBatchIdLocal(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM pillar_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  return formatVideoId({
    accountName: campaign.account_name || 'umum',
    modulePrefix: 'opc',
    campaignId: campaign.id,
    sequence: sequenceNumber,
    productSlug: getProductSlug(campaign, item)
  });
}

function getIfcBatchIdLocal(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM instant_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  return formatVideoId({
    accountName: campaign.account_name || 'umum',
    modulePrefix: 'ifc',
    campaignId: campaign.id,
    sequence: sequenceNumber,
    productSlug: getProductSlug(campaign, item)
  });
}

/**
 * Helper to upload a local file to Nextcloud WebDAV if it doesn't already exist.
 * Returns the Nextcloud remote WebDAV URL.
 */
async function uploadToNextcloudIfMissing(client, localPath, remotePath) {
  const exists = await client.exists(remotePath);
  if (!exists) {
    console.log(`[Nextcloud Sync] Uploading missing file: ${localPath} -> ${remotePath}`);
    // Ensure folders are created recursively
    const folderPath = remotePath.substring(0, remotePath.lastIndexOf('/'));
    if (folderPath) {
      const parts = folderPath.split('/').filter(p => p.trim() !== '');
      let currentPath = '';
      for (const part of parts) {
        currentPath += `/${part}`;
        const folderExists = await client.exists(currentPath);
        if (!folderExists) {
          await client.createDirectory(currentPath);
        }
      }
    }
    const readStream = fs.createReadStream(localPath);
    await client.putFileContents(remotePath, readStream, { overwrite: true });
  }

  return await getOrCreatePublicShareLink(remotePath);
}

export async function syncReCampaignAssetsToNextcloud(campaign, items, parentFolder) {
  const db = getDb();
  const client = getNextcloudClient();

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const paddedIndex = String(idx + 1).padStart(3, '0');

    // 1. Check if item has angle variants
    const variants = db.prepare('SELECT * FROM re_item_angle_variants WHERE re_item_id = ?').all(item.id);

    if (variants && variants.length > 0) {
      for (const variant of variants) {
        const baseBatchId = getReBatchIdLocal(campaign, item, db);
        const batchId = `${baseBatchId}-Angle-${variant.angle_name}`;
        const basePath = `${parentFolder}/${batchId}`.replace(/\/+/g, '/');
 
        try {
          let driveUrl = variant.drive_link || '';
 
          // A. Video final
          if (variant.ffmpeg_status === 'completed' && variant.ffmpeg_output_path) {
            const finalFileName = `${batchId}_video_final.mp4`;
            const finalVideoPath = path.join(process.cwd(), 'public', variant.ffmpeg_output_path);
 
            if (fs.existsSync(finalVideoPath)) {
              driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalFileName}`);
              // Backup copy for backward compatibility
              try {
                await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/video_final.mp4`);
              } catch (_) {}
            }
          } else if (variant.visual_clip_paths) {
            // B. Video clips
            let localPaths = [];
            try {
              localPaths = JSON.parse(variant.visual_clip_paths || '[]');
            } catch {}
 
            let clipUploaded = false;
            for (let i = 0; i < localPaths.length; i++) {
              const clipPath = path.join(process.cwd(), 'public', localPaths[i]);
              const clipFileName = `RE-${campaign.campaign_name}-${paddedIndex}-Angle-${variant.angle_name}-Clip-${i + 1}.mp4`;
 
              if (fs.existsSync(clipPath)) {
                await uploadToNextcloudIfMissing(client, clipPath, `${basePath}/${clipFileName}`);
                clipUploaded = true;
              }
            }
            if (clipUploaded && !driveUrl) {
              driveUrl = await getOrCreatePublicShareLink(basePath);
            }
          }
 
          // C. Audio files
          if (variant.tts_batch_id && variant.tts_batch_id !== 'skipped') {
            const ttsClips = db.prepare("SELECT * FROM tts_studio_clips WHERE batch_id = ? AND status = 'completed'").all(variant.tts_batch_id);
            for (const clip of ttsClips) {
              if (clip.audio_path) {
                const audioLocalPath = path.join(process.cwd(), 'public', clip.audio_path);
                const audioFileName = `RE-${campaign.campaign_name}-${paddedIndex}-Angle-${variant.angle_name}-Audio-${clip.clip_index + 1}.mp3`;
 
                if (fs.existsSync(audioLocalPath)) {
                  await uploadToNextcloudIfMissing(client, audioLocalPath, `${basePath}/${audioFileName}`);
                }
              }
            }
          }

          // D. Narrative Markdown (naskah.md / [batchId]_naskah.md)
          if (variant.result_json) {
            try {
              const { buildMarkdownContent } = await import('./export-builder.js');
              const parsedResult = JSON.parse(variant.result_json || '{}');
              const markdownContent = buildMarkdownContent(parsedResult, batchId);
              const remoteMdPath = `${basePath}/${batchId}_naskah.md`;
              const exists = await client.exists(remoteMdPath);
              if (!exists) {
                await client.putFileContents(remoteMdPath, Buffer.from(markdownContent, 'utf-8'));
                // Backup copy
                await client.putFileContents(`${basePath}/naskah.md`, Buffer.from(markdownContent, 'utf-8'));
              }
            } catch (mdErr) {
              console.error('[Nextcloud Sync RE Variant MD] Failed:', mdErr.message);
            }
          }
 
          if (driveUrl && driveUrl !== variant.drive_link) {
            db.prepare("UPDATE re_item_angle_variants SET upload_status = 'completed', drive_link = ? WHERE id = ?").run(driveUrl, variant.id);
          }
 
        } catch (err) {
          console.error(`[Nextcloud Sync] Failed syncing variant ${variant.angle_name}:`, err.message);
        }
      }
    } else {
      // 2. Item has no angle variants
      const batchId = getReBatchIdLocal(campaign, item, db);
      const basePath = `${parentFolder}/${batchId}`.replace(/\/+/g, '/');
 
      try {
        let driveUrl = item.drive_link || '';
 
        // A. Video final
        if (item.ffmpeg_status === 'completed' && item.ffmpeg_output_path && item.ffmpeg_output_path !== 'skipped') {
          const finalFileName = `${batchId}_video_final.mp4`;
          const finalVideoPath = path.join(process.cwd(), 'public', item.ffmpeg_output_path);
 
          if (fs.existsSync(finalVideoPath)) {
            driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalFileName}`);
            // Backup copy for backward compatibility
            try {
              await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/video_final.mp4`);
            } catch (_) {}
          }
        } else if (item.visual_clip_paths) {
          // B. Video clips
          let localPaths = [];
          try {
            localPaths = JSON.parse(item.visual_clip_paths || '[]');
          } catch {}
 
          let clipUploaded = false;
          for (let i = 0; i < localPaths.length; i++) {
            const clipPath = path.join(process.cwd(), 'public', localPaths[i]);
            const clipFileName = `RE-${campaign.campaign_name}-${paddedIndex}-Clip-${i + 1}.mp4`;
 
            if (fs.existsSync(clipPath)) {
              await uploadToNextcloudIfMissing(client, clipPath, `${basePath}/${clipFileName}`);
              clipUploaded = true;
            }
          }
          if (clipUploaded && !driveUrl) {
            driveUrl = await getOrCreatePublicShareLink(basePath);
          }
        }
 
        // C. Audio files
        if (item.tts_batch_id && item.tts_batch_id !== 'skipped') {
          const ttsClips = db.prepare("SELECT * FROM tts_studio_clips WHERE batch_id = ? AND status = 'completed'").all(item.tts_batch_id);
          for (const clip of ttsClips) {
            if (clip.audio_path) {
              const audioLocalPath = path.join(process.cwd(), 'public', clip.audio_path);
              const audioFileName = `RE-${campaign.campaign_name}-${paddedIndex}-Audio-${clip.clip_index + 1}.mp3`;
 
              if (fs.existsSync(audioLocalPath)) {
                await uploadToNextcloudIfMissing(client, audioLocalPath, `${basePath}/${audioFileName}`);
              }
            }
          }
        }

        // D. Narrative Markdown (naskah.md / [batchId]_naskah.md)
        if (item.result_json) {
          try {
            const { buildMarkdownContent } = await import('./export-builder.js');
            const parsedResult = JSON.parse(item.result_json || '{}');
            const markdownContent = buildMarkdownContent(parsedResult, batchId);
            const remoteMdPath = `${basePath}/${batchId}_naskah.md`;
            const exists = await client.exists(remoteMdPath);
            if (!exists) {
              await client.putFileContents(remoteMdPath, Buffer.from(markdownContent, 'utf-8'));
              // Backup copy
              await client.putFileContents(`${basePath}/naskah.md`, Buffer.from(markdownContent, 'utf-8'));
            }
          } catch (mdErr) {
            console.error('[Nextcloud Sync RE Item MD] Failed:', mdErr.message);
          }
        }
 
        if (driveUrl && driveUrl !== item.drive_link) {
          updateReCampaignItem(item.id, { drive_link: driveUrl, upload_status: 'completed' });
        }
 
      } catch (err) {
        console.error(`[Nextcloud Sync] Failed syncing item #${item.id}:`, err.message);
      }
    }
  }
}

export async function syncOpcCampaignAssetsToNextcloud(campaign, items, parentFolder) {
  const db = getDb();
  const client = getNextcloudClient();

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const paddedIndex = String(idx + 1).padStart(3, '0');

    const batchId = getOpcBatchIdLocal(campaign, item, db);
    const basePath = `${parentFolder}/${batchId}`.replace(/\/+/g, '/');

    try {
      let driveUrl = item.drive_link || '';

      // A. Video final
      if (item.ffmpeg_status === 'completed' && item.ffmpeg_output_path && item.ffmpeg_output_path !== 'skipped') {
        const finalVideoFileNameCloud = `${batchId}_video_final.mp4`;
        const finalVideoPath = path.join(process.cwd(), 'public', item.ffmpeg_output_path);

        if (fs.existsSync(finalVideoPath)) {
          driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalVideoFileNameCloud}`);
          // Backup copy
          try {
            await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/video_final.mp4`);
          } catch (_) {}
        }
      } else if (item.visual_clip_paths) {
        // B. Video clips
        let localPaths = [];
        try {
          localPaths = JSON.parse(item.visual_clip_paths || '[]');
        } catch {}

        let clipUploaded = false;
        for (let i = 0; i < localPaths.length; i++) {
          const clipPath = path.join(process.cwd(), 'public', localPaths[i]);
          const clipFileName = `OPC-${campaign.campaign_name}-${paddedIndex}-Clip-${i + 1}.mp4`;

          if (fs.existsSync(clipPath)) {
            await uploadToNextcloudIfMissing(client, clipPath, `${basePath}/${clipFileName}`);
            clipUploaded = true;
          }
        }
        if (clipUploaded && !driveUrl) {
          driveUrl = await getOrCreatePublicShareLink(basePath);
        }
      }

      // C. Audio files
      if (item.tts_batch_id && item.tts_batch_id !== 'skipped') {
        const ttsClips = db.prepare("SELECT * FROM tts_studio_clips WHERE batch_id = ? AND status = 'completed'").all(item.tts_batch_id);
        for (const clip of ttsClips) {
          if (clip.audio_path) {
            const audioLocalPath = path.join(process.cwd(), 'public', clip.audio_path);
            const audioFileName = `OPC-${campaign.campaign_name}-${paddedIndex}-Audio-${clip.clip_index + 1}.mp3`;

            if (fs.existsSync(audioLocalPath)) {
              await uploadToNextcloudIfMissing(client, audioLocalPath, `${basePath}/${audioFileName}`);
            }
          }
        }
      }

      // D. Narrative Markdown (naskah.md / [batchId]_naskah.md)
      if (item.result_json) {
        try {
          const { buildMarkdownContent } = await import('./export-builder.js');
          const parsedResult = JSON.parse(item.result_json || '{}');
          const markdownContent = buildMarkdownContent(parsedResult, batchId);
          const remoteMdPath = `${basePath}/${batchId}_naskah.md`;
          const exists = await client.exists(remoteMdPath);
          if (!exists) {
            await client.putFileContents(remoteMdPath, Buffer.from(markdownContent, 'utf-8'));
            // Backup copy
            await client.putFileContents(`${basePath}/naskah.md`, Buffer.from(markdownContent, 'utf-8'));
          }
        } catch (mdErr) {
          console.error('[Nextcloud Sync OPC MD] Failed:', mdErr.message);
        }
      }

      if (driveUrl && driveUrl !== item.drive_link) {
        updatePillarCampaignItem(item.id, { drive_link: driveUrl, upload_status: 'completed' });
      }

    } catch (err) {
      console.error(`[Nextcloud Sync] Failed syncing OPC item #${item.id}:`, err.message);
    }
  }
}

export async function syncIfcCampaignAssetsToNextcloud(campaign, items, parentFolder) {
  const db = getDb();
  const client = getNextcloudClient();

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const paddedIndex = String(idx + 1).padStart(3, '0');

    // Folder batch name (Standardized with IFC batch ID)
    const batchId = getIfcBatchIdLocal(campaign, item, db);
    const basePath = `${parentFolder}/${batchId}`.replace(/\/+/g, '/');

    try {
      let driveUrl = item.drive_link || '';

      // A. Video final
      if (item.ffmpeg_status === 'completed' && item.ffmpeg_output_path && item.ffmpeg_output_path !== 'skipped') {
        const finalVideoFileNameCloud = `${batchId}_video_final.mp4`;
        const finalVideoPath = path.join(process.cwd(), 'public', item.ffmpeg_output_path);

        if (fs.existsSync(finalVideoPath)) {
          driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalVideoFileNameCloud}`);
          // Backup copy
          try {
            await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/video_final.mp4`);
          } catch (_) {}
        }
      } else if (item.visual_clip_paths) {
        // B. Video clips
        let localPaths = [];
        try {
          localPaths = JSON.parse(item.visual_clip_paths || '[]');
        } catch {}

        let clipUploaded = false;
        for (let i = 0; i < localPaths.length; i++) {
          const clipPath = path.join(process.cwd(), 'public', localPaths[i]);
          const clipFileName = `IFC-${campaign.product_name}-${paddedIndex}-Clip-${i + 1}.mp4`;

          if (fs.existsSync(clipPath)) {
            await uploadToNextcloudIfMissing(client, clipPath, `${basePath}/${clipFileName}`);
            clipUploaded = true;
          }
        }
        if (clipUploaded && !driveUrl) {
          driveUrl = await getOrCreatePublicShareLink(basePath);
        }
      }

      // C. Audio files
      if (item.tts_batch_id && item.tts_batch_id !== 'skipped') {
        const ttsClips = db.prepare("SELECT * FROM tts_studio_clips WHERE batch_id = ? AND status = 'completed'").all(item.tts_batch_id);
        for (const clip of ttsClips) {
          if (clip.audio_path) {
            const audioLocalPath = path.join(process.cwd(), 'public', clip.audio_path);
            const audioFileName = `IFC-${campaign.product_name}-${paddedIndex}-Audio-${clip.clip_index + 1}.mp3`;

            if (fs.existsSync(audioLocalPath)) {
              await uploadToNextcloudIfMissing(client, audioLocalPath, `${basePath}/${audioFileName}`);
            }
          }
        }
      }

      // D. Narrative Markdown (naskah.md / [batchId]_naskah.md)
      if (item.result_json) {
        try {
          const { buildMarkdownContent } = await import('./export-builder.js');
          const parsedResult = JSON.parse(item.result_json || '{}');
          const markdownContent = buildMarkdownContent(parsedResult, batchId);
          const remoteMdPath = `${basePath}/${batchId}_naskah.md`;
          const exists = await client.exists(remoteMdPath);
          if (!exists) {
            await client.putFileContents(remoteMdPath, Buffer.from(markdownContent, 'utf-8'));
            // Backup copy
            await client.putFileContents(`${basePath}/naskah.md`, Buffer.from(markdownContent, 'utf-8'));
          }
        } catch (mdErr) {
          console.error('[Nextcloud Sync IFC MD] Failed:', mdErr.message);
        }
      }

      if (driveUrl && driveUrl !== item.drive_link) {
        updateInstantCampaignItem(item.id, { drive_link: driveUrl, upload_status: 'completed' });
      }

    } catch (err) {
      console.error(`[Nextcloud Sync] Failed syncing IFC item #${item.id}:`, err.message);
    }
  }
}
