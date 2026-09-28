import { HttpClient } from '@/framework/client/http-client';

/**
 * Shopping-City redesign API surface (all additive endpoints):
 *  - GET  geo/reverse          — map-pin → server-authoritative {city, district, state, pincode}
 *  - POST cart/validate-city   — change-city cart migration (available / unavailable split)
 *  - PUT  me/shopping-city     — persist the choice on the profile (logged-in only)
 * Every call fails soft — the UI treats errors as "no data", never as a crash.
 */

export interface ReverseGeo {
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  normalized_city: string | null;
  city_id: number | null;
  /** City-status only (City::acceptsOrders) — NOT a delivery verdict. It ignores the pincode
   *  allow-list, delivery coverage, per-vertical gates, COD and ETA, and it is cached for an
   *  hour. Ask `delivery-pincodes/check` before telling a shopper we deliver. */
  is_serviceable: boolean;

  /** Google's full street-level address for the pin. The server has always returned it; the
   *  interface omitted it, so it was discarded at the TypeScript boundary. */
  formatted_address: string | null;
  country: string | null;
  country_code: string | null;
  /** Locality / neighbourhood, e.g. "Indiranagar". */
  area: string | null;
  /** 'google' = a real geocode; 'nearest_city' = a ≤50km guess that cannot know a pincode. */
  source: 'google' | 'nearest_city';
}

export async function reverseGeocodePin(
  lat: number,
  lng: number,
): Promise<ReverseGeo | null> {
  try {
    return await HttpClient.get<ReverseGeo>('geo/reverse', { lat, lng });
  } catch {
    return null;
  }
}

/** The real delivery verdict for a pincode — see `checkPincode`. */
export interface PincodeVerdict {
  serviceable: boolean;
  pincode: string;
  city?: string | null;
  state?: string | null;
  area?: string | null;
  cod_enabled?: boolean;
  eta_days?: number | null;
  available_vendors?: number;
  /** true = nothing is configured for this pincode, so the answer is fail-open, not a promise. */
  unconfigured?: boolean;
  source?: string | null;
}

/**
 * "Do we actually deliver to this pincode?" — the only answer that consults delivery coverage
 * AND the legacy allow-list, then applies the city-activation gate, the per-vertical operations
 * gate, COD and ETA.
 *
 * Deliberately NOT ReverseGeo.is_serviceable, which is City::acceptsOrders() — city status only,
 * blind to coverage, and cached for an hour. The map chip used that and could therefore tell a
 * shopper "Serviceable" for a pincode no vendor covers.
 *
 * Fails soft to null, like everything else in this module: a serviceability outage must never
 * stop someone saving an address.
 */
export async function checkPincode(
  pincode: string,
): Promise<PincodeVerdict | null> {
  if (!/^[1-9][0-9]{5}$/.test(pincode)) return null;
  try {
    return await HttpClient.get<PincodeVerdict>('delivery-pincodes/check', {
      pincode,
    });
  } catch {
    return null;
  }
}

export interface CityCartLine {
  product_id: number;
  variation_option_id: number | null;
  quantity: number;
  unit_price?: number | null;
}

export interface ValidateCityResult {
  city: string;
  available: CityCartLine[];
  unavailable: CityCartLine[];
}

export async function validateCartCity(
  city: string,
  items: Array<{ product_id: number; variation_option_id: number | null; quantity: number }>,
): Promise<ValidateCityResult | null> {
  try {
    const res = await HttpClient.post<{ data: ValidateCityResult }>(
      'cart/validate-city',
      { city, items },
    );
    return (res as any)?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Client-side city comparison — ONLY for grouping/labels in the UI; the server remains the
 * authority at checkout.
 *
 * Districts are handled by RULE, not by a list. This used to be a hand-copied mirror of the
 * server's alias table and it had drifted to six entries: it knew "new delhi" but not "South
 * Delhi", "North Delhi" or the seven other NCT districts Google actually returns, so a Delhi
 * shopper failed every comparison the UI made about their own city. A copied table is a second
 * source of truth for a question the server already answers; the rule cannot drift.
 */
const SUBDIVISION_PREFIXES = [
  'north east',
  'north west',
  'south east',
  'south west',
  'north',
  'south',
  'east',
  'west',
  'central',
  'new',
];

const SUBDIVISION_SUFFIXES = ['city', 'suburban', 'urban', 'rural'];

/** Historical renames — genuinely different names for the same place, not districts. */
const CITY_ALIASES: Record<string, string> = {
  gurgaon: 'gurugram',
  bangalore: 'bengaluru',
  bombay: 'mumbai',
  calcutta: 'kolkata',
  madras: 'chennai',
};

/**
 * ⚠️ Strips the administrative qualifier unconditionally, which the SERVER does not — the server
 * also checks the remainder is a city we ship to, so it can leave a genuine district like
 * "East Siang" alone. The browser has no city list to make that check, so this is safe for
 * comparing two places against each other and never for deciding what to display or store.
 */
export function normalizeCityClient(city?: string | null): string {
  // Collapse INTERNAL whitespace too: the geo master really contains "North East  Delhi".
  let key = String(city ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
  if (!key) return '';

  for (const prefix of SUBDIVISION_PREFIXES) {
    if (key.startsWith(`${prefix} `)) {
      key = key.slice(prefix.length + 1);
      break;
    }
  }
  for (const suffix of SUBDIVISION_SUFFIXES) {
    if (key.endsWith(` ${suffix}`)) {
      key = key.slice(0, -(suffix.length + 1));
      break;
    }
  }

  return CITY_ALIASES[key] ?? key;
}

/** The city an address belongs to, preferring the server-reverse-geocoded one. */
export function addressCityOf(address: any): string | null {
  const a = address ?? {};
  const c = a.rg_city ?? a.address?.rg_city ?? a.address?.city ?? a.city ?? null;
  const s = String(c ?? '').trim();
  return s || null;
}

/** Persist the shopping city on the signed-in profile (users.preferred_city). Silent. */
export async function saveShoppingCityToProfile(city: string): Promise<void> {
  try {
    await HttpClient.put('me/shopping-city', { city });
  } catch {
    /* guest / non-serviceable / offline — localStorage remains the source */
  }
}
