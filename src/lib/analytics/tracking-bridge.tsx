'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/framework/user';
import { setTrackUser, trackPage } from '@/lib/analytics/track';

/**
 * Mounts inside the app providers (so useUser/react-query work) and drives
 * storefront analytics: attaches the logged-in user id (advisory) and emits a
 * page view (+ funnel step) on every navigation. Renders nothing; everything is
 * fail-safe inside the tracker.
 *
 * App Router port: router.events doesn't exist — a usePathname effect fires on
 * every client navigation instead (identical behavior).
 */
export default function TrackingBridge() {
  const pathname = usePathname();
  const { me } = useUser();

  useEffect(() => {
    setTrackUser(me?.id ?? null);
  }, [me?.id]);

  useEffect(() => {
    if (!pathname) return;
    try {
      trackPage(pathname);
    } catch {
      /* noop */
    }
  }, [pathname]);

  return null;
}
