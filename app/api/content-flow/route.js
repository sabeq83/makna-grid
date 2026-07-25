import { NextResponse } from 'next/server';
import { getContentFlowItems } from '@/lib/db';
import { scanAndSyncExistingCampaigns } from '@/lib/contentflow-ingest';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceType = searchParams.get('source_type') || 'all';
    const accountName = searchParams.get('account') || 'all';
    const productName = searchParams.get('product') || 'all';
    const pipelineStatus = searchParams.get('pipeline_status') || 'all';
    const tiktokStatus = searchParams.get('tiktok_status') || 'Semua';
    const facebookStatus = searchParams.get('facebook_status') || 'Semua';
    const instagramStatus = searchParams.get('instagram_status') || 'Semua';
    const q = searchParams.get('q') || '';
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';

    // RBAC Check for Brand Access
    const currentUser = getCurrentUser(request);
    let allowedAccounts = undefined;
    if (currentUser && currentUser.role !== 'admin') {
      allowedAccounts = currentUser.assignedBrandNames || [];
    }

    let result = getContentFlowItems({
      sourceType,
      accountName,
      productName,
      pipelineStatus,
      tiktokStatus,
      facebookStatus,
      instagramStatus,
      q,
      page,
      limit,
      allowedAccounts
    });

    // Auto sync if empty on first load
    if (result.items.length === 0 && page === '1' && !q && sourceType === 'all' && accountName === 'all' && (!allowedAccounts || allowedAccounts.length > 0)) {
      scanAndSyncExistingCampaigns();
      result = getContentFlowItems({
        sourceType,
        accountName,
        productName,
        pipelineStatus,
        tiktokStatus,
        facebookStatus,
        instagramStatus,
        q,
        page,
        limit,
        allowedAccounts
      });
    }

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[API /api/content-flow GET Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
