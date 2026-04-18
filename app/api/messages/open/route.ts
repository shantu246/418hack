import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { readUserSession } from '@/lib/user-session';

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createServerSupabase();

  const { data: msg, error: fetchErr } = await supabase
    .from('messages')
    .select('ping_type, is_burned, nickname')
    .eq('id', id)
    .single();

  if (fetchErr || !msg) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (msg.is_burned) return NextResponse.json({ error: 'already burned' }, { status: 410 });

  // Whisper: only sender can open
  if (msg.ping_type === 'whisper') {
    const session = readUserSession(req);
    if (!session) return NextResponse.json({ error: '私语需要登录才能查看' }, { status: 401 });
    if (msg.nickname !== session.username) {
      return NextResponse.json({ error: '无权限查看该私语' }, { status: 403 });
    }
  }

  // Mirage: burn after reading (no login required)
  if (msg.ping_type === 'mirage') {
    await supabase.from('messages').update({ is_burned: true }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}
