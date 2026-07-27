import { getDb, upsertContentFlowItem } from './db.js';
import { generateVideoId } from './id-generator.js';

/**
 * Scan all campaign tables in MAKNA Grid SQLite database
 * and populate content_flow_items with completed video assets.
 */
export function scanAndSyncExistingCampaigns() {
  const db = getDb();
  let totalIngested = 0;

  // 1. Scan OPC (Pillar Campaigns)
  try {
    const opcItems = db.prepare(`
      SELECT pci.*, pc.campaign_name, pc.brand_profile_id, pc.target_product_id,
             bp.brand_name AS bp_brand_name,
             pe.product_name AS pe_product_name, pe.source_url AS pe_source_url, pe.affiliate_link AS pe_affiliate_link,
             cp.affiliate_url AS cp_affiliate_url
      FROM pillar_campaign_items pci
      JOIN pillar_campaigns pc ON pci.campaign_id = pc.id
      LEFT JOIN brand_profiles bp ON pc.brand_profile_id = bp.id
      LEFT JOIN product_extractions pe ON pc.target_product_id = pe.id
      LEFT JOIN content_planners cp ON pc.target_product_id = cp.product_id
    `).all();

    for (const item of opcItems) {
      let payload = {};
      try { payload = JSON.parse(item.row_creative_payload || '{}'); } catch (_) {}
      let result = {};
      try { result = JSON.parse(item.result_json || '{}'); } catch (_) {}
      let social = {};
      try { social = JSON.parse(item.social_links_json || '{}'); } catch (_) {}

      const accountName = item.bp_brand_name || payload.account_name || 'Umum';
      const productName = item.pe_product_name || payload.product_name || 'Umum';
      const productUrl = item.pe_source_url || payload.source_product_url || '';
      const linkAffiliate = payload.affiliate_url || payload.affiliate_link || item.pe_affiliate_link || item.cp_affiliate_url || '';

      const videoId = payload.video_id || generateVideoId({
        accountName: accountName,
        modulePrefix: 'opc',
        campaignId: item.campaign_id,
        sequence: item.sequence || item.id
      });
      const hook = payload.custom_hook || payload.hook || item.pillar || 'OPC Video Item';
      const caption = social.caption || social.tiktok_caption || payload.caption || (result.social_media_package && result.social_media_package.caption) || result.tiktok_caption || '';
      const rawDriveLink = item.drive_link || result.drive_link || '';
      const rawNcUrl = item.nextcloud_url || result.nextcloud_url || '';
      const isNcLink = (rawDriveLink && (rawDriveLink.includes('100.78.186.123') || rawDriveLink.includes('index.php/s/') || rawDriveLink.toLowerCase().includes('nextcloud')));

      const driveLink = isNcLink ? '' : rawDriveLink;
      const nextcloudUrl = isNcLink ? rawDriveLink : rawNcUrl;
      const urlAsset = (item.ffmpeg_output_path && item.ffmpeg_output_path !== 'skipped') ? item.ffmpeg_output_path : (nextcloudUrl || driveLink);

      upsertContentFlowItem({
        id: `opc_${item.id}`,
        source_type: 'opc',
        source_campaign_id: item.campaign_id,
        source_item_id: item.id,
        account_name: accountName,
        video_id: videoId,
        campaign_title: item.campaign_name || 'Organic Pillar Campaign',
        hook: hook,
        nama_produk: productName,
        link_affiliate: linkAffiliate,
        link_produk: productUrl,
        caption: caption,
        production_date: item.created_at,
        url_asset: urlAsset,
        drive_link: driveLink,
        nextcloud_url: nextcloudUrl,
        pipeline_status: item.workflow_status === 'completed' || item.ffmpeg_output_path ? 'Completed' : 'In Production'
      });
      totalIngested++;
    }
  } catch (err) {
    console.error('[ContentFlow Sync] Error scanning OPC campaigns:', err);
  }

  // 2. Scan Strategic Campaigns
  try {
    const scItems = db.prepare(`
      SELECT sci.*, sc.campaign_name, sc.product_name, sc.product_description
      FROM strategic_campaign_items sci
      JOIN strategic_campaigns sc ON sci.campaign_id = sc.id
    `).all();

    for (const item of scItems) {
      let creative = {};
      try { creative = JSON.parse(item.creative_package_json || '{}'); } catch (_) {}
      let pubPkg = {};
      try { pubPkg = JSON.parse(item.publishing_package_json || '{}'); } catch (_) {}
      let finalPkg = {};
      try { finalPkg = JSON.parse(item.final_package_json || '{}'); } catch (_) {}

      const videoId = pubPkg.video_id || generateVideoId({
        accountName: pubPkg.account_name || 'Umum',
        modulePrefix: 'sc',
        campaignId: item.campaign_id,
        sequence: item.sequence || item.id
      });
      const hook = item.hook || creative.hook || 'Strategic Campaign Item';
      const caption = pubPkg.caption || pubPkg.tiktok_caption || creative.caption || '';
      const driveLink = finalPkg.drive_link || '';
      const nextcloudUrl = finalPkg.nextcloud_url || '';
      const urlAsset = finalPkg.ffmpeg_output_path || driveLink || nextcloudUrl;

      upsertContentFlowItem({
        id: `sc_${item.id}`,
        source_type: 'strategic',
        source_campaign_id: item.campaign_id,
        source_item_id: item.id,
        account_name: pubPkg.account_name || 'Umum',
        video_id: videoId,
        campaign_title: item.campaign_name || 'Strategic Campaign',
        hook: hook,
        nama_produk: item.product_name || item.product || 'Umum',
        link_affiliate: creative.affiliate_url || '',
        link_produk: '',
        caption: caption,
        production_date: item.created_at,
        url_asset: urlAsset,
        drive_link: driveLink,
        nextcloud_url: nextcloudUrl,
        pipeline_status: item.workflow_status === 'completed' || finalPkg.ffmpeg_output_path ? 'Completed' : 'In Production'
      });
      totalIngested++;
    }
  } catch (err) {
    console.error('[ContentFlow Sync] Error scanning Strategic campaigns:', err);
  }

  // 3. Scan RE (Reverse Engineering) Campaigns
  try {
    const reItems = db.prepare(`
      SELECT rci.*, rc.campaign_name
      FROM re_campaign_items rci
      JOIN re_campaigns rc ON rci.campaign_id = rc.id
    `).all();

    for (const item of reItems) {
      const cfId = `re_${item.id}`;

      // Filter out items with Error/Failed status
      const isFailed = [item.scrape_status, item.analyze_status, item.tts_status, item.visual_status, item.ffmpeg_status, item.upload_status]
        .some(s => s && (s.toLowerCase().includes('fail') || s.toLowerCase().includes('error')));

      if (isFailed) {
        // Remove failed items from content_flow_items
        db.prepare('DELETE FROM content_flow_items WHERE id = ? OR source_item_id = ?').run(cfId, String(item.id));
        continue;
      }

      let plan = {};
      let resObj = {};
      try {
        if (item.result_json) {
          resObj = typeof item.result_json === 'object' ? item.result_json : JSON.parse(item.result_json);
        }
      } catch (_) {}

      const videoId = generateVideoId({
        accountName: item.account_name || 'Umum',
        modulePrefix: 're',
        campaignId: item.campaign_id,
        sequence: item.id
      });
      const hook = item.custom_hook
        || item.hook
        || resObj.hook
        || (resObj.social_media_package && resObj.social_media_package.hook)
        || (resObj.new_video_plan && resObj.new_video_plan[0] ? resObj.new_video_plan[0].new_vo : '')
        || (resObj.voiceover && resObj.voiceover[0] ? resObj.voiceover[0].narration : '')
        || plan.hook
        || 'RE Video Item';

      const caption = item.tiktok_caption
        || item.caption
        || resObj.tiktok_caption
        || resObj.ig_caption
        || (resObj.social_media_package && resObj.social_media_package.caption)
        || resObj.caption
        || plan.tiktok_caption
        || '';
      
      let driveLink = item.drive_link || '';
      let nextcloudUrl = item.nextcloud_url || '';

      // Normalize Nextcloud vs Google Drive links
      if (driveLink && (driveLink.includes('100.78.186.123') || driveLink.includes('index.php/s/'))) {
        nextcloudUrl = driveLink;
        driveLink = '';
      }
      if (!nextcloudUrl && item.campaign_id === 'eef644d9-d74c-4a5a-834f-38c230fd9b21') {
        nextcloudUrl = 'http://100.78.186.123/';
      }

      const urlAsset = item.ffmpeg_output_path || nextcloudUrl || driveLink;

      upsertContentFlowItem({
        id: cfId,
        source_type: 're',
        source_campaign_id: item.campaign_id,
        source_item_id: item.id,
        account_name: 'Umum',
        video_id: videoId,
        campaign_title: item.campaign_name || 'Reverse Engineering',
        hook: hook,
        nama_produk: item.product_name || 'Umum',
        link_affiliate: '',
        link_produk: item.source_url || '',
        caption: caption,
        production_date: item.created_at,
        url_asset: urlAsset,
        drive_link: driveLink,
        nextcloud_url: nextcloudUrl,
        pipeline_status: item.workflow_status === 'completed' || item.ffmpeg_output_path ? 'Completed' : 'In Production'
      });
      totalIngested++;
    }
  } catch (err) {
    console.error('[ContentFlow Sync] Error scanning RE campaigns:', err);
  }

  // 4. Scan Pipeline Assets (Instant Factory)
  try {
    const pipelines = db.prepare(`
      SELECT pa.*, pe.product_name, pe.input_source
      FROM pipeline_assets pa
      LEFT JOIN product_extractions pe ON pa.product_id = pe.id
    `).all();

    for (const item of pipelines) {
      const videoId = `PIPE-${item.id.slice(0, 8).toUpperCase()}`;
      const hook = item.selected_idea ? (typeof item.selected_idea === 'string' ? item.selected_idea : JSON.stringify(item.selected_idea)) : 'Pipeline Asset';
      const caption = item.tiktok_caption || item.ig_caption || '';

      upsertContentFlowItem({
        id: `pipe_${item.id}`,
        source_type: 'instant',
        source_campaign_id: item.id,
        source_item_id: item.id,
        account_name: 'Umum',
        video_id: videoId,
        campaign_title: 'Instant Factory Pipeline',
        hook: hook.length > 100 ? hook.slice(0, 100) + '...' : hook,
        nama_produk: item.product_name || 'Umum',
        link_affiliate: '',
        link_produk: item.input_source || '',
        caption: caption,
        production_date: item.created_at,
        url_asset: '',
        drive_link: '',
        nextcloud_url: '',
        pipeline_status: item.status === 'completed' ? 'Completed' : 'In Production'
      });
      totalIngested++;
    }
  } catch (err) {
    console.error('[ContentFlow Sync] Error scanning Pipeline Assets:', err);
  }

  return totalIngested;
}
