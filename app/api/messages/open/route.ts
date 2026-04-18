import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createServerSupabase();

  // Fetch the ping first
  const { data: msg, error: fetchErr } = await supabase
    .from('messages')
    .select('ping_type, is_burned')
    .eq('id', id)
    .single();

  if (fetchErr || !msg) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (msg.is_burned) return NextResponse.json({ error: 'already burned' }, { status: 410 });

  // Mirage: burn after reading
  if (msg.ping_type === 'mirage') {
    await supabase.from('messages').update({ is_burned: true }).eq('id', id);
  }

  return NextResponse.json({ ok: true });
}
