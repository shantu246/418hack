import { NextResponse } from 'next/server';
import { clearUserSessionCookie } from '@/lib/user-session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearUserSessionCookie(res);
  return res;
}
