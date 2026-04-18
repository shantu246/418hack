import { NextRequest, NextResponse } from 'next/server';
import { readUserSession } from '@/lib/user-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = readUserSession(req);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ user: { id: session.userId, username: session.username } });
}
