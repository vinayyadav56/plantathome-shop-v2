'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/store/session';

/** Boots the client session. In M0 this only marks readiness + mirrors the
 *  selected city to a cookie (so Server Components/middleware can read it).
 *  M1 extends this to run a best-effort silent token refresh + load /auth/me. */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const city = useSession((s) => s.city);
  const setReady = useSession((s) => s.setReady);

  // Mirror city → cookie for SSR/middleware.
  useEffect(() => {
    document.cookie = `city=${city ?? ''}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  }, [city]);

  useEffect(() => {
    setReady(true);
  }, [setReady]);

  return <>{children}</>;
}
