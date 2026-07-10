import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, REFRESH_COOKIE, refreshCookieOptions } from '@/lib/auth/bff';

/** Reads the httpOnly refresh cookie, calls Laravel /auth/refresh, and OVERWRITES
 *  the cookie with the freshly-rotated refresh token. On reuse/expiry (Laravel
 *  401 / REFRESH_REUSED) it clears the cookie so the client hard-logs-out. */
export async function POST(req: NextRequest) {
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    // No session is a normal anonymous state, not an error — return a null token
    // (200) so the boot path doesn't log a spurious 401.
    return NextResponse.json({ access_token: null }, { status: 200 });
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const j = await res.json().catch(() => null);

  if (!res.ok || !j?.success) {
    const out = NextResponse.json({ code: j?.errors?.[0]?.code ?? 'REFRESH_FAILED' }, { status: 401 });
    out.cookies.delete(REFRESH_COOKIE);
    return out;
  }

  const { tokens } = j.data;
  const out = NextResponse.json({ access_token: tokens.access_token, expires_in: tokens.expires_in });
  out.cookies.set(REFRESH_COOKIE, tokens.refresh_token, refreshCookieOptions);
  return out;
}
