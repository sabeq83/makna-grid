import { NextResponse } from 'next/server';
import { updateContentFlowPublishStatus, getContentFlowItemById } from '@/lib/db';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const success = updateContentFlowPublishStatus(id, body);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Tidak ada field valid yang diperbarui' }, { status: 400 });
    }

    const updatedItem = getContentFlowItemById(id);
    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error('[API /api/content-flow/[id] PATCH Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
