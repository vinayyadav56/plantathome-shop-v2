import { setAccessTokenAccessor, setRefreshHook } from '@/lib/api/client';

/** The access token lives ONLY in memory (never localStorage) — 15-min TTL, so
 *  losing it on reload is fine; we silently re-mint via the httpOnly refresh
 *  cookie on boot. The refresh token is never visible to JS. */
let accessToken: string | null = null;
let refreshInFlight: Promise<void> | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

async function callRefresh(): Promise<void> {
  const run = async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) {
      accessToken = null;
      throw new Error('REFRESH_FAILED');
    }
    const body = await res.json();
    accessToken = body.access_token ?? null;
  };

  // A single-use rotating refresh token means two concurrent refreshes = reuse =
  // family revocation. Serialize across TABS with the Web Locks API (the refresh
  // cookie is the shared source of truth) and dedupe WITHIN a tab via the module
  // promise below.
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    await navigator.locks.request('pah-auth-refresh', run);
  } else {
    await run();
  }
}

/** All concurrent callers await the SAME in-flight refresh promise. */
export function ensureRefreshed(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = callRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

let wired = false;
/** Wire the auth-agnostic api client to this store. Call once on the client. */
export function wireAuth() {
  if (wired) return;
  wired = true;
  setAccessTokenAccessor(getAccessToken);
  setRefreshHook(ensureRefreshed);
}
