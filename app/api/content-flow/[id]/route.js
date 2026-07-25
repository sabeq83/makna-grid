import { NextResponse } from 'next/server';
import { updateContentFlowPublishStatus, getContentFlowItemById } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const currentUser = getCurrentUser(request);
    const userRole = currentUser ? currentUser.role : 'user';
    const permissions = currentUser && Array.isArray(currentUser.menuPermissions) ? currentUser.menuPermissions : [];

    // RBAC Permissions check for data editing fields
    if (body.link_produk !== undefined && userRole !== 'admin' && !permissions.includes('edit_link_product')) {
      return NextResponse.json({ success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk mengubah Link Product' }, { status: 403 });
    }
    if (body.link_affiliate !== undefined && userRole !== 'admin' && !permissions.includes('edit_link_affiliate')) {
      return NextResponse.json({ success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk mengubah Link Affiliate' }, { status: 403 });
    }
    if (body.nama_produk !== undefined && userRole !== 'admin' && !permissions.includes('edit_nama_product')) {
      return NextResponse.json({ success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk mengubah Nama Product' }, { status: 403 });
    }

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
