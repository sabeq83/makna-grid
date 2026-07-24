import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hashPassword } from '@/lib/schema/user-schema';

export async function POST(req, { params }) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Akses ditolak. Khusus Admin.' }, { status: 403 });
    }

    const { userId } = params;
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.trim() === '') {
      return NextResponse.json({ success: false, error: 'Password baru tidak boleh kosong' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    const hashedPassword = hashPassword(newPassword.trim());
    db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(hashedPassword, userId);

    return NextResponse.json({
      success: true,
      message: `Password untuk user '${user.username}' berhasil diperbarui!`
    });
  } catch (error) {
    console.error('[API Admin Reset Password Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
