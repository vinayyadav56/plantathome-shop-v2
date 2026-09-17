/**
 * Lightweight customer-location store (localStorage). Captured once via the
 * "Deliver to my location" prompt; used to request location-derived pricing /
 * availability (coarse in P2, precise once the P3 matching engine lands) and,
 * later, vendor + delivery-partner matching at checkout.
 */
export interface CustomerLatLng {
  lat: number;
  lng: number;
  at?: string;
}

const KEY = 'pah_customer_location';

export function getStoredLatLng(): CustomerLatLng | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.lat === 'number' && typeof v?.lng === 'number') return v;
  } catch {
    // ignore
  }
  return null;
}

export function setStoredLatLng(lat: number, lng: number): CustomerLatLng {
  const v: CustomerLatLng = { lat, lng, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
    window.dispatchEvent(new Event('pah-location-changed'));
  } catch {
    // ignore
  }
  return v;
}

const AREA_KEY = 'pah_customer_area';

/**
 * The shopper's neighbourhood ("Rohini"), captured alongside the city when we
 * resolve a real position. DISPLAY ONLY — the catalogue is scoped by city, so
 * nothing here ever narrows what is on sale.
 */
export function getStoredArea(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const a = window.localStorage.getItem(AREA_KEY);
    return a && a.trim() ? a : null;
  } catch {
    return null;
  }
}

export function setStoredArea(area: string | null): void {
  try {
    if (area && area.trim()) {
      window.localStorage.setItem(AREA_KEY, area.trim());
    } else {
      window.localStorage.removeItem(AREA_KEY);
    }
    window.dispatchEvent(new Event('pah-location-changed'));
  } catch {
    // ignore
  }
}

const CITY_KEY = 'pah_customer_city';

/** The customer's selected city — drives city-first availability ("Available in your city"). */
export function getStoredCity(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const c = window.localStorage.getItem(CITY_KEY);
    return c && c.trim() ? c : null;
  } catch {
    return null;
  }
}

/**
 * Silently set the customer's city. Used to auto-select the city on login (e.g. from
 * the user's saved address) without any prompt, and by a manual city selector.
 */
export function setStoredCity(city: string, area?: string | null): void {
  try {
    const next = (city ?? '').trim();
    // A city change invalidates the stored neighbourhood unless the caller
    // supplies a matching one — otherwise picking "Mumbai" by hand would leave
    // the header reading "Rohini, Mumbai".
    const prev = (window.localStorage.getItem(CITY_KEY) ?? '').trim();
    if (area && area.trim()) {
      window.localStorage.setItem(AREA_KEY, area.trim());
    } else if (next.toLowerCase() !== prev.toLowerCase()) {
      window.localStorage.removeItem(AREA_KEY);
    }
    if (next) {
      window.localStorage.setItem(CITY_KEY, next);
    } else {
      window.localStorage.removeItem(CITY_KEY);
    }
    window.dispatchEvent(new Event('pah-location-changed'));
  } catch {
    // ignore
  }
}

const PINCODE_KEY = 'pah_customer_pincode';

/**
 * The customer's pincode (when known — from a saved/selected address or IP detect). Drives
 * the live courier serviceability + ETA at checkout (the API only fetches a courier rate
 * when a pincode is supplied). Optional: city alone still works for vendor-rate estimates.
 */
export function getStoredPincode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const p = (window.localStorage.getItem(PINCODE_KEY) || '').replace(/\D/g, '');
    return p.length >= 4 ? p : null;
  } catch {
    return null;
  }
}

/** Set/clear the stored pincode. Pass a falsy value to clear (e.g. on a manual city switch). */
export function setStoredPincode(pincode?: string | null): void {
  try {
    const p = (pincode || '').replace(/\D/g, '');
    if (p.length >= 4) {
      window.localStorage.setItem(PINCODE_KEY, p);
    } else {
      window.localStorage.removeItem(PINCODE_KEY);
    }
    window.dispatchEvent(new Event('pah-location-changed'));
  } catch {
    // ignore
  }
}

/** Prompt the browser for the current position and persist it. */
export function captureLocation(): Promise<CustomerLatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(setStoredLatLng(+pos.coords.latitude.toFixed(7), +pos.coords.longitude.toFixed(7))),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}
