import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'ping_admin_session';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const ADMIN_COOKIE_VALUE = 'authenticated';

export function isValidAdminCredential(username?: string, password?: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function isAdminRequest(req: NextRequest): boolean {
  return req.cookies.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}

export function getAdminCookieValue(): string {
  return ADMIN_COOKIE_VALUE;
}
