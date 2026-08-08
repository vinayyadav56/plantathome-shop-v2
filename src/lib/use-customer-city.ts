import { useSyncExternalStore, useCallback } from 'react';
import { getStoredCity, setStoredCity } from '@/lib/customer-location';

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

export function useCustomerCity(): {
  city: string | null;
  setCity: (city: string) => void;
} {
  const city = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const setCity = useCallback((c: string) => setStoredCity(c), []);
  return { city, setCity };
}
