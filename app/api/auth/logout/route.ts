import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, REFRESH_COOKIE } from '@/lib/auth/bff';

/** Best-effort server-side logout (revokes the token family), then clears the
 *  httpOnly refresh cookie regardless. */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...(auth ? { Authorization: auth } : {}) },
  }).catch(() => {});

  const out = NextResponse.json({ ok: true });
  out.cookies.delete(REFRESH_COOKIE);
  return out;
}
