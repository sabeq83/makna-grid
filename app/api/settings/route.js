import { NextResponse } from 'next/server';
import { getSetting, setSetting } from '@/lib/db';
import { testGeminiConnection } from '@/lib/gemini';

export async function GET() {
  try {
    const apiKey = getSetting('gemini_api_key');
    const minimaxKey = getSetting('minimax_api_key');
    return NextResponse.json({
      success: true,
      data: {
        gemini_api_key: apiKey ? '••••••••' + apiKey.slice(-6) : null,
        has_api_key: !!apiKey,
        gemini_api_tier: getSetting('gemini_api_tier') || 'paid',
        gemini_context_caching: getSetting('gemini_context_caching') || 'on',
        minimax_api_key: minimaxKey ? '••••••••' + minimaxKey.slice(-6) : null,
        has_minimax_key: !!minimaxKey,
        minimax_group_id: getSetting('minimax_group_id') || '',
        webhook_api_key: getSetting('webhook_api_key') || '',
        webhook_host: getSetting('webhook_host') || '100.117.59.92',
        webhook_port: getSetting('webhook_port') || '8765',
        webhook_image_model: getSetting('webhook_image_model') || 'nano_banana_pro',
        webhook_video_model: getSetting('webhook_video_model') || 'veo_31_lite_relaxed',
        webhook_delay_enabled: getSetting('webhook_delay_enabled') !== null ? Number(getSetting('webhook_delay_enabled')) : 1,
        webhook_delay_min: getSetting('webhook_delay_min') !== null ? Number(getSetting('webhook_delay_min')) : 10,
        webhook_delay_max: getSetting('webhook_delay_max') !== null ? Number(getSetting('webhook_delay_max')) : 20,
        webhook_t2i_pattern: getSetting('webhook_t2i_pattern') || 'threading',
        // V3 Workspace
        drive_glabs_folder_id: getSetting('drive_glabs_folder_id') || '',
        drive_re_markdown_folder_id: getSetting('drive_re_markdown_folder_id') || '',
        master_re_sheet_id: getSetting('master_re_sheet_id') || '',
        drive_product_photo_folder: getSetting('drive_product_photo_folder') || '_fotoproduk',
        // Nextcloud
        storage_provider: getSetting('storage_provider') || 'gdrive',
        nextcloud_url: getSetting('nextcloud_url') || '',
        nextcloud_username: getSetting('nextcloud_username') || '',
        nextcloud_app_password: getSetting('nextcloud_app_password') || '',
        nextcloud_target_folder: getSetting('nextcloud_target_folder') || '/MAKNA_Video_Generations',
        save_to_local_storage: Number(getSetting('save_to_local_storage') || 0),
        local_storage_path: getSetting('local_storage_path') || 'renders',
        // Facebook Page Credentials
        fb_page_id: getSetting('fb_page_id') || '',
        fb_page_ids: getSetting('fb_page_ids') || '',
        fb_page_token: getSetting('fb_page_token') ? '••••••••' + getSetting('fb_page_token').slice(-6) : '',
        has_fb_token: !!getSetting('fb_page_token'),
        fb_server_url: getSetting('fb_server_url') || '',
        scraper_headless_enabled: getSetting('scraper_headless_enabled') !== null ? Number(getSetting('scraper_headless_enabled')) : 1,
        scraper_use_cdp: getSetting('scraper_use_cdp') !== null ? Number(getSetting('scraper_use_cdp')) : 0,
        scraper_chrome_profile: getSetting('scraper_chrome_profile') || 'Default',
        ytdlp_cookies_from_browser: getSetting('ytdlp_cookies_from_browser') || 'none',
        // Content Flow Direct Ingestion API
        contentflow_api_key: getSetting('contentflow_api_key') ? '••••••••' + getSetting('contentflow_api_key').slice(-6) : '',
        has_contentflow_key: !!getSetting('contentflow_api_key'),
        contentflow_api_url: getSetting('contentflow_api_url') || 'http://100.78.186.123:3001/api/v1/content/ingest',
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { gemini_api_key, gemini_api_tier, gemini_context_caching, google_client_id, google_client_secret,
      webhook_api_key, webhook_host, webhook_port, webhook_image_model, webhook_video_model,
      webhook_delay_enabled, webhook_delay_min, webhook_delay_max, webhook_t2i_pattern,
      drive_glabs_folder_id, drive_re_markdown_folder_id, master_re_sheet_id, drive_product_photo_folder,
      storage_provider, nextcloud_url, nextcloud_username, nextcloud_app_password, nextcloud_target_folder,
      minimax_api_key, minimax_group_id, save_to_local_storage, local_storage_path,
      fb_page_id, fb_page_ids, fb_page_token, fb_server_url, scraper_headless_enabled, scraper_use_cdp, scraper_chrome_profile, ytdlp_cookies_from_browser,
      contentflow_api_key, contentflow_api_url } = body;
    
    if (gemini_api_key) {
      setSetting('gemini_api_key', gemini_api_key);
    }
    if (gemini_api_tier !== undefined) {
      setSetting('gemini_api_tier', gemini_api_tier);
    }
    if (gemini_context_caching !== undefined) {
      setSetting('gemini_context_caching', gemini_context_caching);
    }
    if (minimax_api_key) {
      setSetting('minimax_api_key', minimax_api_key);
    }
    if (minimax_group_id !== undefined) {
      setSetting('minimax_group_id', minimax_group_id);
    }
    if (google_client_id) {
      setSetting('google_client_id', google_client_id);
    }
    if (google_client_secret) {
      setSetting('google_client_secret', google_client_secret);
    }
    if (webhook_api_key !== undefined) setSetting('webhook_api_key', webhook_api_key);
    if (webhook_host !== undefined) setSetting('webhook_host', webhook_host);
    if (webhook_port !== undefined) setSetting('webhook_port', webhook_port);
    if (webhook_image_model !== undefined) setSetting('webhook_image_model', webhook_image_model);
    if (webhook_video_model !== undefined) setSetting('webhook_video_model', webhook_video_model);
    if (webhook_delay_enabled !== undefined) setSetting('webhook_delay_enabled', String(webhook_delay_enabled ? 1 : 0));
    if (webhook_delay_min !== undefined) setSetting('webhook_delay_min', String(webhook_delay_min));
    if (webhook_delay_max !== undefined) setSetting('webhook_delay_max', String(webhook_delay_max));
    if (webhook_t2i_pattern !== undefined) setSetting('webhook_t2i_pattern', webhook_t2i_pattern);
    // V3 Workspace
    if (drive_glabs_folder_id !== undefined) setSetting('drive_glabs_folder_id', drive_glabs_folder_id);
    if (drive_re_markdown_folder_id !== undefined) setSetting('drive_re_markdown_folder_id', drive_re_markdown_folder_id);
    if (master_re_sheet_id !== undefined) setSetting('master_re_sheet_id', master_re_sheet_id);
    if (drive_product_photo_folder !== undefined) setSetting('drive_product_photo_folder', drive_product_photo_folder);
    // Nextcloud
    if (storage_provider !== undefined) setSetting('storage_provider', storage_provider);
    if (nextcloud_url !== undefined) setSetting('nextcloud_url', nextcloud_url);
    if (nextcloud_username !== undefined) setSetting('nextcloud_username', nextcloud_username);
    if (nextcloud_app_password !== undefined) setSetting('nextcloud_app_password', nextcloud_app_password);
    if (nextcloud_target_folder !== undefined) setSetting('nextcloud_target_folder', nextcloud_target_folder);
    if (save_to_local_storage !== undefined) setSetting('save_to_local_storage', String(save_to_local_storage));
    if (local_storage_path !== undefined) setSetting('local_storage_path', local_storage_path);
    // Facebook Page Credentials
    if (fb_page_id !== undefined) setSetting('fb_page_id', fb_page_id);
    if (fb_page_ids !== undefined) setSetting('fb_page_ids', fb_page_ids);
    if (fb_page_token) setSetting('fb_page_token', fb_page_token);
    if (fb_server_url !== undefined) setSetting('fb_server_url', fb_server_url);
    if (scraper_headless_enabled !== undefined) setSetting('scraper_headless_enabled', String(scraper_headless_enabled ? 1 : 0));
    if (scraper_use_cdp !== undefined) setSetting('scraper_use_cdp', String(scraper_use_cdp ? 1 : 0));
    if (scraper_chrome_profile !== undefined) setSetting('scraper_chrome_profile', scraper_chrome_profile);
    if (ytdlp_cookies_from_browser !== undefined) setSetting('ytdlp_cookies_from_browser', ytdlp_cookies_from_browser);
    // Content Flow Direct Ingestion API
    if (contentflow_api_key) setSetting('contentflow_api_key', contentflow_api_key);
    if (contentflow_api_url !== undefined) setSetting('contentflow_api_url', contentflow_api_url);

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
