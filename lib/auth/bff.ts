/** Server-only config shared by the auth BFF route handlers. */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'https://plantathome-production.up.railway.app/api/v1';

export const REFRESH_COOKIE = 'pah_refresh';

export const refreshCookieOptions = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 14, // 14 days (matches IDENTITY_REFRESH_TTL)
};
