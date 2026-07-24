import { NextResponse } from 'next/server';
import { syncStrategicCampaignToContentFlow } from '@/lib/strategic-campaign-engine';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const result = await syncStrategicCampaignToContentFlow(id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[API /v2/pillar-campaigns/[id]/sync-contentflow POST Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
