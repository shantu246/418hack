import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { hashPassword } from '@/lib/password';
import { setUserSessionCookie } from '@/lib/user-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 });
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    return NextResponse.json({ error: '用户名长度需为 3-20' }, { status: 400 });
  }
  if (password.length < 6 || password.length > 72) {
    return NextResponse.json({ error: '密码长度需为 6-72' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: existing, error: findErr } = await supabase
    .from('app_users')
    .select('id')
    .eq('username', trimmedUsername)
    .limit(1)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (existing) return NextResponse.json({ error: '用户名已存在' }, { status: 409 });

  const passwordHash = hashPassword(password);
  const { data: created, error: createErr } = await supabase
    .from('app_users')
    .insert({ username: trimmedUsername, password_hash: passwordHash })
    .select('id, username')
    .single();

  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

  const res = NextResponse.json({ ok: true, user: created });
  setUserSessionCookie(res, { userId: created.id, username: created.username, iat: Date.now() });
  return res;
}
