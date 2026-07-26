const { pgQuery } = require('../lib/db-pg');
const { getDb } = require('../lib/db');
const { generateVideoId } = require('../lib/id-generator.js');

async function importReCampaignToNutribake() {
  const CAMPAIGN_ID = '66b4d649-8045-4edf-b3e4-375428108797';
  const TARGET_ACCOUNT = 'nutribake';
  const SOURCE_URL = `http://100.65.62.63:3003/api/v2/re-campaigns/${CAMPAIGN_ID}`;

  console.log(`🚀 [Import Script] Connecting to ${SOURCE_URL}...`);

  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch source campaign: ${response.status} ${response.statusText}`);
  }

  const resData = await response.json();
  const campaign = resData.campaign || resData;
  const items = resData.items || campaign.items || [];

  if (!campaign || (!campaign.id && !campaign.campaign_name)) {
    throw new Error('Invalid campaign payload received from source server');
  }

  const campaignTitle = campaign.campaign_name || 'Resep Alpukat Smoothie';
  console.log(`📦 [Import Script] Found Campaign: "${campaignTitle}" (Items: ${items.length})`);

  const sqliteDb = getDb();

  // 1. Insert or Update re_campaigns in PostgreSQL & SQLite
  try {
    const sqlPgCamp = `
      INSERT INTO re_campaigns (id, campaign_name, status, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET campaign_name = $2;
    `;
    await pgQuery(sqlPgCamp, [CAMPAIGN_ID, campaignTitle, campaign.status || 'completed']);
    console.log(`✓ [PostgreSQL Node 3] Campaign "${campaignTitle}" registered.`);
  } catch (err) {
    console.warn(`[PostgreSQL Node 3 Warning] Campaign insert:`, err.message);
  }

  try {
    const sqliteStmt = sqliteDb.prepare(`
      INSERT OR REPLACE INTO re_campaigns (id, campaign_name, status, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    sqliteStmt.run(CAMPAIGN_ID, campaignTitle, campaign.status || 'completed');
    console.log(`✓ [SQLite Node 1] Campaign "${campaignTitle}" registered.`);
  } catch (err) {
    console.warn(`[SQLite Node 1 Warning] Campaign insert:`, err.message);
  }

  // 2. Process each item and sync to content_flow_items
  let insertedCount = 0;

  for (const item of items) {
    insertedCount++;
    const videoId = generateVideoId({
      accountName: TARGET_ACCOUNT,
      modulePrefix: 're',
      campaignId: CAMPAIGN_ID,
      sequence: insertedCount
    });
    const cfId = `cf_nutribake_re_${item.id}`;

    // Parse result_json if available
    let parsedRes = {};
    if (item.result_json) {
      try {
        parsedRes = typeof item.result_json === 'string' ? JSON.parse(item.result_json) : item.result_json;
      } catch (_) {}
    }

    // Extract caption
    let caption = item.caption || parsedRes.tiktok_caption || parsedRes.ig_caption || (parsedRes.social_package && parsedRes.social_package.caption) || parsedRes.caption || '';

    // Extract hook
    let hook = item.hook || (parsedRes.voiceover && parsedRes.voiceover[0] ? parsedRes.voiceover[0].narration : '') || parsedRes.hook || '';

    // Extract best video asset URL
    let assetUrl = item.drive_link || item.ffmpeg_output_path || item.local_video_path || '';
    if (Array.isArray(item.glabs_tasks) && item.glabs_tasks.length > 0) {
      const completedGlabs = item.glabs_tasks.find(g => g.status === 'completed' && g.video_url);
      if (completedGlabs) {
        assetUrl = completedGlabs.video_url;
      }
    }

    const namaProduk = item.product_name || campaign.product_name || 'Nutribake Alpukat Smoothie';
    const linkAffiliate = campaign.affiliate_url || '';
    const linkProduk = campaign.product_url || '';
    const todayStr = new Date().toISOString();

    // PostgreSQL Node 3 Insert into content_flow_items
    try {
      const pgSqlCF = `
        INSERT INTO content_flow_items (
          id, source_type, source_campaign_id, source_item_id, account_name,
          video_id, campaign_title, hook, nama_produk, link_affiliate, link_produk,
          caption, production_date, url_asset, drive_link, nextcloud_url,
          pipeline_status, tiktok_status, facebook_status, instagram_status, youtube_status,
          created_at, updated_at
        )
        VALUES (
          $1, 're', $2, $3, $4,
          $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          'Completed', 'Not Published', 'Not Published', 'Not Published', 'Not Published',
          NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          account_name = EXCLUDED.account_name,
          video_id = EXCLUDED.video_id,
          campaign_title = EXCLUDED.campaign_title,
          hook = EXCLUDED.hook,
          nama_produk = EXCLUDED.nama_produk,
          link_affiliate = EXCLUDED.link_affiliate,
          link_produk = EXCLUDED.link_produk,
          caption = EXCLUDED.caption,
          url_asset = EXCLUDED.url_asset,
          nextcloud_url = EXCLUDED.nextcloud_url,
          updated_at = NOW();
      `;

      await pgQuery(pgSqlCF, [
        cfId, CAMPAIGN_ID, String(item.id), TARGET_ACCOUNT,
        videoId, campaignTitle, hook, namaProduk, linkAffiliate, linkProduk,
        caption, todayStr, assetUrl, item.drive_link || '', assetUrl
      ]);
    } catch (pgErr) {
      console.warn(`[PostgreSQL Node 3 Error] Item ${item.id}:`, pgErr.message);
    }

    // SQLite Insert into content_flow_items
    try {
      const sqliteStmtCF = sqliteDb.prepare(`
        INSERT OR REPLACE INTO content_flow_items (
          id, source_type, source_campaign_id, source_item_id, account_name,
          video_id, campaign_title, hook, nama_produk, link_affiliate, link_produk,
          caption, production_date, url_asset, drive_link, nextcloud_url,
          pipeline_status, tiktok_status, facebook_status, instagram_status, youtube_status,
          created_at, updated_at
        )
        VALUES (
          ?, 're', ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          'Completed', 'Not Published', 'Not Published', 'Not Published', 'Not Published',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `);

      sqliteStmtCF.run(
        cfId, CAMPAIGN_ID, String(item.id), TARGET_ACCOUNT,
        videoId, campaignTitle, hook, namaProduk, linkAffiliate, linkProduk,
        caption, todayStr, assetUrl, item.drive_link || '', assetUrl
      );
    } catch (sqErr) {
      console.warn(`[SQLite Node 1 Error] Item ${item.id}:`, sqErr.message);
    }
    console.log(`  [Item ${insertedCount}/${items.length}] Ingested video_id: "${videoId}" for account: "${TARGET_ACCOUNT}"`);
  }

  console.log(`\n🎉 [Import Success] Successfully ingested ${insertedCount} items into ContentFlow under account "${TARGET_ACCOUNT}"!`);
  process.exit(0);
}

importReCampaignToNutribake().catch(err => {
  console.error('❌ [Import Error]', err);
  process.exit(1);
});
