import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  getAdminCookieValue,
  isValidAdminCredential,
} from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!isValidAdminCredential(username, password)) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: getAdminCookieValue(),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return res;
}
