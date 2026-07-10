'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/store/session';
import { wireAuth, ensureRefreshed, getAccessToken } from '@/lib/auth/token-store';
import { getMe } from '@/lib/api/auth';

/** Boots the client session: wires the api client to the in-memory token store,
 *  runs a best-effort silent refresh (via the httpOnly cookie) then loads
 *  /auth/me. Anonymous browsing is fine — catalog is public. Also mirrors the
 *  selected city to a cookie so Server Components/middleware can read it. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const city = useSession((s) => s.city);
  const setUser = useSession((s) => s.setUser);
  const setReady = useSession((s) => s.setReady);

  useEffect(() => {
    document.cookie = `city=${city ?? ''}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  }, [city]);

  useEffect(() => {
    let cancelled = false;
    wireAuth();
    (async () => {
      try {
        await ensureRefreshed(); // mint an access token from the refresh cookie (if any)
        if (getAccessToken()) {
          const user = await getMe();
          if (!cancelled) setUser(user);
        } else if (!cancelled) {
          setUser(null); // anonymous — no /auth/me call, no 401
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser, setReady]);

  return <>{children}</>;
}
