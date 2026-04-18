import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { readUserSession } from '@/lib/user-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const radius = parseInt(searchParams.get('radius') ?? '500');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc('get_nearby_messages', {
    user_lat: lat,
    user_lng: lng,
    radius_meters: radius,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = readUserSession(req);
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const body = await req.json();
  const { content, avatar_id, ping_type, image_url, lat, lng } = body;

  if (!content || typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'content, lat, lng required' }, { status: 400 });
  }

  const nickname = session.username ?? '未知用户';
  if (!nickname || nickname === 'Anonymous') {
    return NextResponse.json({ error: '登录状态异常，请重新登录' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      content,
      nickname,
      avatar_id: avatar_id ?? 0,
      ping_type: ping_type ?? 'classic',
      image_url: image_url ?? null,
      lat,
      lng,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
