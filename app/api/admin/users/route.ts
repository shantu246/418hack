import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { isAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: user, error: fetchErr } = await supabase
    .from('app_users')
    .select('id, username')
    .eq('id', id)
    .single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const { error: delMsgErr } = await supabase.from('messages').delete().eq('nickname', user.username);
  if (delMsgErr) return NextResponse.json({ error: delMsgErr.message }, { status: 500 });

  const { error: delUserErr } = await supabase.from('app_users').delete().eq('id', id);
  if (delUserErr) return NextResponse.json({ error: delUserErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
