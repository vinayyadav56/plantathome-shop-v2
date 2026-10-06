'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@/framework/user';
import { setTrackUser, track, trackPage } from '@/lib/analytics/track';
import { getStoredCity } from '@/lib/customer-location';

/**
 * Mounts inside the app providers (so useUser/react-query work) and drives
 * storefront analytics: attaches the logged-in user id (advisory), emits a
 * page view (+ funnel step) on every navigation, and turns the storefront's
 * own `pah-location-changed` event (fired by every city/area/pincode setter in
 * customer-location.ts) into ONE `city_changed` event — the setters' callers
 * no longer track it themselves. Renders nothing; everything is fail-safe
 * inside the tracker.
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

  useEffect(() => {
    let last = getStoredCity();
    const onChange = () => {
      const city = getStoredCity();
      if (city && city !== last) {
        last = city;
        track('city_changed', { label: city });
      }
    };
    window.addEventListener('pah-location-changed', onChange);
    return () => window.removeEventListener('pah-location-changed', onChange);
  }, []);

  return null;
}
