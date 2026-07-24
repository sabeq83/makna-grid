import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST(req) {
  try {
    const cookiesHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookiesHeader.split(';').map(c => {
        const [k, v] = c.trim().split('=');
        return [k, decodeURIComponent(v || '')];
      })
    );
    const token = cookies['makna_session'];

    if (token) {
      destroySession(token);
    }

    const response = NextResponse.json({ success: true, message: 'Logout berhasil' });
    response.cookies.set({
      name: 'makna_session',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });

    return response;
  } catch (error) {
    console.error('[API Auth Logout Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
