import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { readUserSession } from '@/lib/user-session';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('message_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = readUserSession(req);
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const { id } = await params;
  const { content, avatar_id } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('comments')
    .insert({
      message_id: id,
      nickname: session.username,
      avatar_id: avatar_id ?? 0,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
