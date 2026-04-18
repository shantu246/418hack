import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { verifyPassword } from '@/lib/password';
import { setUserSessionCookie } from '@/lib/user-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 });
  }

  const trimmedUsername = username.trim();
  const supabase = createServerSupabase();
  const { data: user, error } = await supabase
    .from('app_users')
    .select('id, username, password_hash')
    .eq('username', trimmedUsername)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username } });
  setUserSessionCookie(res, { userId: user.id, username: user.username, iat: Date.now() });
  return res;
}
