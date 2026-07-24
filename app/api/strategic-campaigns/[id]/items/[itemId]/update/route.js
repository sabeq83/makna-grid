import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id: campaignId, itemId } = resolvedParams;
    const body = await req.json();

    const db = getDb();
    const item = db.prepare("SELECT * FROM strategic_campaign_items WHERE id = ?").get(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    const { scenes, publishingPackage } = body;

    const transaction = db.transaction(() => {
      // 1. Update scenes if provided
      if (Array.isArray(scenes)) {
        const updateSceneStmt = db.prepare(`
          UPDATE strategic_campaign_scenes
          SET visual_action = ?, voice_over = ?, t2i_prompt = ?, i2v_prompt = ?
          WHERE id = ? AND campaign_item_id = ?
        `);
        for (const sc of scenes) {
          updateSceneStmt.run(
            sc.visual_action || '',
            sc.voice_over || '',
            sc.t2i_prompt || '',
            sc.i2v_prompt || '',
            sc.id,
            itemId
          );
        }
      }

      // 2. Update publishing_package_json if provided
      if (publishingPackage) {
        db.prepare(`
          UPDATE strategic_campaign_items
          SET publishing_package_json = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(JSON.stringify(publishingPackage), itemId);
      }
    });

    transaction();

    return NextResponse.json({ success: true, message: 'Item berhasil diperbarui' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
