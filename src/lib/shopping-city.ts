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
  is_serviceable: boolean;
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
