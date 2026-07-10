import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, REFRESH_COOKIE, refreshCookieOptions } from '@/lib/auth/bff';

/** Proxies Laravel /auth/login. On success: stashes the refresh token in an
 *  httpOnly cookie (never exposed to JS) and returns the access token + user. */
export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}) as Record<string, string>);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json().catch(() => null);

  if (!res.ok || !j?.success) {
    return NextResponse.json(
      { code: j?.errors?.[0]?.code ?? 'LOGIN_FAILED', message: j?.errors?.[0]?.message ?? 'Login failed.' },
      { status: res.status || 401 },
    );
  }

  const { tokens, user } = j.data;
  const out = NextResponse.json({ access_token: tokens.access_token, expires_in: tokens.expires_in, user });
  out.cookies.set(REFRESH_COOKIE, tokens.refresh_token, refreshCookieOptions);
  return out;
}
