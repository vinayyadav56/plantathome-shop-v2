'use client';

import { getAccessToken, setAccessToken } from '@/lib/auth/token-store';
import { get } from './client';
import type { SessionUser } from './types';

/** Log in via the BFF: sets the httpOnly refresh cookie server-side, returns the
 *  access token (kept in memory) + user. */
export async function authLogin(email: string, password: string): Promise<SessionUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(j?.message ?? 'Login failed.');
  }
  setAccessToken(j.access_token);
  return j.user as SessionUser;
}

export async function authLogout(): Promise<void> {
  const token = getAccessToken();
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {});
  setAccessToken(null);
}

/** Fetch the current user with the in-memory access token (used on boot). */
export const getMe = () => get<{ user: SessionUser }>('/auth/me').then((r) => r.user);
