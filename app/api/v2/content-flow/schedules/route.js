import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    if (!brandId) {
      return NextResponse.json({ success: false, error: 'brandId parameter is required' }, { status: 400 });
    }

    const db = getDb();
    const rows = db.prepare('SELECT * FROM brand_schedules WHERE brand_id = ? ORDER BY slot_index ASC').all(brandId);
    return NextResponse.json({ success: true, schedules: rows });
  } catch (error) {
    console.error('[API /v2/content-flow/schedules GET Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { brandId, slots } = body; // slots = [{ slot_index, product_id, product_name, target_daily_posts }]

    if (!brandId || !Array.isArray(slots)) {
      return NextResponse.json({ success: false, error: 'Invalid brandId or slots array' }, { status: 400 });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO brand_schedules (brand_id, slot_index, product_id, product_name, target_daily_posts, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(brand_id, slot_index) DO UPDATE SET
        product_id = EXCLUDED.product_id,
        product_name = EXCLUDED.product_name,
        target_daily_posts = EXCLUDED.target_daily_posts,
        updated_at = CURRENT_TIMESTAMP
    `);

    for (const slot of slots) {
      stmt.run(
        brandId,
        slot.slot_index,
        slot.product_id || '',
        slot.product_name || '',
        slot.target_daily_posts || 1
      );
    }

    return NextResponse.json({ success: true, message: 'Brand schedules updated successfully' });
  } catch (error) {
    console.error('[API /v2/content-flow/schedules POST Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
