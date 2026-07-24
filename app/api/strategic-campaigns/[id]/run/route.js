import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { writeLogToFile } from '@/lib/console-hook';
import path from 'path';

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const body = await req.json().catch(() => ({}));

    const db = getDb();
    const campaign = db.prepare("SELECT * FROM strategic_campaigns WHERE id = ?").get(campaignId);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Kampanye tidak ditemukan' }, { status: 404 });
    }

    let nextStatus = body.status;
    if (!nextStatus) {
      nextStatus = campaign.status === 'running' ? 'paused' : 'running';
    }

    db.prepare("UPDATE strategic_campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(nextStatus, campaignId);

    const logFile = path.join(process.cwd(), 'public', 'strategic_campaign_logs.txt');
    writeLogToFile(logFile, `[Status Campaign] Kampanye ${campaignId} (${campaign.campaign_name}) diubah statusnya menjadi ${nextStatus.toUpperCase()}.`);

    return NextResponse.json({
      success: true,
      status: nextStatus,
      message: `Status kampanye berhasil diubah menjadi ${nextStatus}`
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
