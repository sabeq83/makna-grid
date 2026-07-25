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

function getReBatchIdLocal(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM re_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  const paddedIndex = String(sequenceNumber).padStart(3, '0');
  
  const cleanName = (campaign.campaign_name || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const campaignCode = cleanName || 'GEN';
  const itemDate = new Date(item.created_at || Date.now());
  const dateStr = itemDate.toISOString().slice(0, 10).replace(/-/g, '');
  return `RE-${campaignCode}-${dateStr}-${paddedIndex}`;
}

function getOpcBatchIdLocal(campaign, item, db) {
  const campaignItems = db.prepare('SELECT id FROM pillar_campaign_items WHERE campaign_id = ? ORDER BY id ASC').all(campaign.id);
  const itemIndex = campaignItems.findIndex(i => i.id === item.id);
  const sequenceNumber = itemIndex !== -1 ? itemIndex + 1 : 1;
  const paddedIndex = String(sequenceNumber).padStart(3, '0');
  
  const cleanName = (campaign.campaign_name || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  const campaignCode = cleanName || 'GEN';
  const dateStr = new Date(campaign.created_at || Date.now()).toISOString().slice(0, 10).replace(/-/g, '');
  return `OPC-${campaignCode}-${dateStr}-${paddedIndex}`;
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
            const finalFileName = `RE-${campaign.campaign_name}-${paddedIndex}-Angle-${variant.angle_name}.mp4`;
            const finalVideoPath = path.join(process.cwd(), 'public', variant.ffmpeg_output_path);
 
            if (fs.existsSync(finalVideoPath)) {
              driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalFileName}`);
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
          const finalFileName = `RE-${campaign.campaign_name}-${paddedIndex}.mp4`;
          const finalVideoPath = path.join(process.cwd(), 'public', item.ffmpeg_output_path);
 
          if (fs.existsSync(finalVideoPath)) {
            driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalFileName}`);
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
        const finalVideoFileNameCloud = `OPC-${campaign.campaign_name.replace(/[^a-zA-Z0-9_]/g, '_')}-${paddedIndex}.mp4`;
        const finalVideoPath = path.join(process.cwd(), 'public', item.ffmpeg_output_path);

        if (fs.existsSync(finalVideoPath)) {
          driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalVideoFileNameCloud}`);
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

    // Folder batch name
    const batchFolderName = campaign.is_mass_production === 1
      ? `IFC_${campaign.product_name.replace(/[^a-zA-Z0-9_]/g, '_')}_${paddedIndex}`
      : `IFC-${campaign.product_name}-${paddedIndex}`;

    const basePath = `${parentFolder}/${batchFolderName}`.replace(/\/+/g, '/');

    try {
      let driveUrl = item.drive_link || '';

      // A. Video final
      if (item.ffmpeg_status === 'completed' && item.ffmpeg_output_path && item.ffmpeg_output_path !== 'skipped') {
        const finalVideoFileNameCloud = `IFC-${campaign.product_name.replace(/[^a-zA-Z0-9_]/g, '_')}-${paddedIndex}.mp4`;
        const finalVideoPath = path.join(process.cwd(), 'public', item.ffmpeg_output_path);

        if (fs.existsSync(finalVideoPath)) {
          driveUrl = await uploadToNextcloudIfMissing(client, finalVideoPath, `${basePath}/${finalVideoFileNameCloud}`);
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

      if (driveUrl && driveUrl !== item.drive_link) {
        updateInstantCampaignItem(item.id, { drive_link: driveUrl, upload_status: 'completed' });
      }

    } catch (err) {
      console.error(`[Nextcloud Sync] Failed syncing IFC item #${item.id}:`, err.message);
    }
  }
}
