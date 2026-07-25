import { getDb, upsertContentFlowItem } from './db.js';

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
      SELECT pci.*, pc.campaign_name, pc.account_name, pc.product_name, pc.source_product_url
      FROM pillar_campaign_items pci
      JOIN pillar_campaigns pc ON pci.campaign_id = pc.id
    `).all();

    for (const item of opcItems) {
      let payload = {};
      try { payload = JSON.parse(item.row_creative_payload || '{}'); } catch (_) {}
      let result = {};
      try { result = JSON.parse(item.result_json || '{}'); } catch (_) {}
      let social = {};
      try { social = JSON.parse(item.social_links_json || '{}'); } catch (_) {}

      const videoId = payload.video_id || `OPC-${item.id.slice(0, 8).toUpperCase()}`;
      const hook = payload.custom_hook || payload.hook || item.pillar || 'OPC Video Item';
      const caption = social.caption || social.tiktok_caption || payload.caption || '';
      const driveLink = item.drive_link || result.drive_link || '';
      const nextcloudUrl = item.nextcloud_url || result.nextcloud_url || '';
      const urlAsset = item.ffmpeg_output_path && item.ffmpeg_output_path !== 'skipped' ? item.ffmpeg_output_path : driveLink || nextcloudUrl;

      upsertContentFlowItem({
        id: `opc_${item.id}`,
        source_type: 'opc',
        source_campaign_id: item.campaign_id,
        source_item_id: item.id,
        account_name: item.account_name || 'Umum',
        video_id: videoId,
        campaign_title: item.campaign_name || 'Organic Pillar Campaign',
        hook: hook,
        nama_produk: item.product_name || payload.product_name || 'Umum',
        link_affiliate: payload.affiliate_url || '',
        link_produk: item.source_product_url || '',
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

      const videoId = pubPkg.video_id || `SC-${item.id.slice(0, 8).toUpperCase()}`;
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
      try { plan = JSON.parse(item.new_video_plan_json || '{}'); } catch (_) {}

      const videoId = `RE-${item.id.slice(0, 8).toUpperCase()}`;
      const hook = item.custom_hook || plan.hook || 'RE Video Item';
      const caption = item.tiktok_caption || plan.tiktok_caption || '';
      
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
