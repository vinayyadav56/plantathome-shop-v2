import { useSyncExternalStore, useCallback } from 'react';
import { getStoredArea, getStoredCity, setStoredCity } from '@/lib/customer-location';

const CITY_EVENT = 'pah-location-changed';

function subscribe(cb: () => void) {
  window.addEventListener(CITY_EVENT, cb);
  window.addEventListener('storage', cb); // another tab changed the city
  return () => {
    window.removeEventListener(CITY_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

// Client reads the stored city SYNCHRONOUSLY on the very first render; SSR and the
// pre-hydration client render both return null. This is the fix for a real perf
// regression: the old implementation seeded `useState(null)` and only set the city
// inside an effect, so every React-Query key that includes the city churned null→city
// and fired TWICE per PDP view (product, location-price, types, svc-availability...).
// useSyncExternalStore's explicit server snapshot keeps SSR and first paint agreeing on
// null (no hydration mismatch), then swaps to the real value synchronously — no extra
// render, no key churn. Mirrors the repo's own next-router.ts:87-91 pattern.
const getClientSnapshot = () => getStoredCity();
const getServerSnapshot = () => null;
// Area rides the SAME store + event, so it can never render a beat behind the
// city it belongs to.
const getAreaClientSnapshot = () => getStoredArea();

export function useCustomerCity(): {
  city: string | null;
  /** Neighbourhood, when a real position was resolved. Display only. */
  area: string | null;
  /** "Rohini, Delhi" when the area is known, otherwise just the city. */
  label: string | null;
  setCity: (city: string, area?: string | null) => void;
} {
  const city = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const area = useSyncExternalStore(subscribe, getAreaClientSnapshot, getServerSnapshot);
  const setCity = useCallback((c: string, a?: string | null) => setStoredCity(c, a), []);
  const label = city ? (area ? `${area}, ${city}` : city) : null;
  return { city, area, label, setCity };
}
