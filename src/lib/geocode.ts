import type { ExtractedAddress } from '@/lib/extract-address';

/**
 * Lightweight location helpers for the storefront location gate. Everything is
 * best-effort + fail-safe: a failure resolves to null and NEVER blocks shopping.
 */

/**
 * Coarse city/pincode from the visitor's IP — the gentle first-visit detection
 * that needs no permission prompt. Goes through the SAME-ORIGIN /api/geo route
 * (which resolves server-side) — a direct ipapi.co fetch is CORS-blocked from the
 * browser and threw a console error on every visit. Fail-safe → null.
 */
export async function getCityFromIP(): Promise<ExtractedAddress | null> {
  try {
    const res = await fetch('/api/geo', {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const j: any = await res.json();
    const city = j?.city ? String(j.city) : undefined;
    if (!city) return null;
    return {
      city,
      district: j?.region ? String(j.region) : undefined,
      state: j?.region ? String(j.region) : undefined,
      state_code: j?.region_code ? String(j.region_code) : undefined,
      pincode: j?.postal ? String(j.postal) : undefined,
      country: j?.country_name ? String(j.country_name) : undefined,
    };
  } catch {
    return null;
  }
}

/*
 * (Removed 2026-10-12: reverseGeocode(), which called Google's Geocoding REST API from the
 * browser with the public Maps key. Google refuses referrer-restricted keys on that API —
 * every call came back REQUEST_DENIED, so "Detect my location" never found a city. Reverse
 * geocoding is server-side: reverseGeocodePin() in lib/shopping-city.ts → GET geo/reverse,
 * which also maps Google's names onto ours ("Gurgaon" → Gurugram) and returns our city_id.)
 */

export type CoordsResult =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'unsupported' | 'denied' | 'unavailable' | 'timeout' };

/**
 * Ask the browser where the shopper is (one-shot) and say WHY when it can't — the city picker
 * shows a different message for "blocked" than for "couldn't find you". City-level is all we
 * need, so low accuracy (Wi-Fi/IP based: fast, and works on desktops with no GPS) and a
 * 5-minute cache.
 */
export function getBrowserCoords(): Promise<CoordsResult> {
  return new Promise((resolve) => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation ||
      (typeof window !== 'undefined' && window.isSecureContext === false)
    ) {
      resolve({ ok: false, reason: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          lat: +pos.coords.latitude.toFixed(7),
          lng: +pos.coords.longitude.toFixed(7),
        }),
      (err) =>
        resolve({
          ok: false,
          reason: err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable',
        }),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );
  });
}
