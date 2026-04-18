import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const USER_SESSION_COOKIE = 'ping_user_session';

export type UserSession = {
  userId: string;
  username: string;
  iat: number;
};

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  return Buffer.from(padded, 'base64');
}

function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET || 'dev-insecure-secret';
}

export function signUserSession(session: UserSession): string {
  const payload = base64UrlEncode(JSON.stringify(session));
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest();
  return `${payload}.${base64UrlEncode(sig)}`;
}

export function verifyUserSessionToken(token?: string | null): UserSession | null {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest();

  const actualSig = base64UrlDecode(sigB64);
  if (actualSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null;

  const payloadJson = base64UrlDecode(payloadB64).toString('utf8');
  const parsed = JSON.parse(payloadJson) as Partial<UserSession>;
  if (!parsed.userId || !parsed.username || typeof parsed.iat !== 'number') return null;
  return { userId: parsed.userId, username: parsed.username, iat: parsed.iat };
}

export function readUserSession(req: NextRequest): UserSession | null {
  const token = req.cookies.get(USER_SESSION_COOKIE)?.value;
  return verifyUserSessionToken(token);
}

export function setUserSessionCookie(res: NextResponse, session: UserSession): void {
  const token = signUserSession(session);
  res.cookies.set({
    name: USER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearUserSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: USER_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
