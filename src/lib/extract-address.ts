/**
 * Robustly extract a usable address from Google `address_components`.
 *
 * Fixes the bug where a village / sublocality landed in the City field: the
 * city is resolved by a strict priority and is NEVER taken from a village,
 * sublocality, neighbourhood, premise or route. Those granular parts go to the
 * street/area instead.
 *
 * City priority (per spec):
 *   locality → postal_town → administrative_area_level_2 (district) →
 *   administrative_area_level_1 (state, last resort).
 */
export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface ExtractedAddress {
  /** The neighbourhood the shopper is actually in (Rohini, Koramangala…).
   *  Display only — the CITY is what scopes the catalogue. */
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  country?: string;
  street_address?: string;
}

function find(components: GoogleAddressComponent[], type: string) {
  return components?.find(
    (c) => Array.isArray(c?.types) && c.types.includes(type),
  );
}

/** The shopper's serviceable city — never a village/sublocality/neighbourhood. */
export function extractCorrectCity(
  components: GoogleAddressComponent[],
): string | undefined {
  const order = [
    'locality',
    'postal_town',
    'administrative_area_level_2', // district (e.g. Rewari for a village in it)
    'administrative_area_level_1', // state — last resort only
  ];
  for (const type of order) {
    const c = find(components, type);
    if (c?.long_name) return c.long_name;
  }
  return undefined;
}

/** Full structured address; `street_address` collects the granular parts. */
export function extractAddress(
  components: GoogleAddressComponent[],
): ExtractedAddress {
  if (!Array.isArray(components)) return {};
  const state = find(components, 'administrative_area_level_1');
  // The neighbourhood, on its own. It is still part of street_address below
  // (that string is the postal line), but the shopper-facing "Rohini, Delhi"
  // needs it separated from premise/route noise.
  const area =
    find(components, 'sublocality_level_1')?.long_name ||
    find(components, 'sublocality')?.long_name ||
    find(components, 'neighborhood')?.long_name ||
    undefined;
  const street =
    [
      find(components, 'premise')?.long_name,
      find(components, 'street_number')?.long_name,
      find(components, 'route')?.long_name,
      find(components, 'sublocality_level_1')?.long_name,
      find(components, 'neighborhood')?.long_name,
    ]
      .filter(Boolean)
      .join(', ') || undefined;

  return {
    area,
    city: extractCorrectCity(components),
    district: find(components, 'administrative_area_level_2')?.long_name,
    state: state?.long_name,
    state_code: state?.short_name,
    pincode: find(components, 'postal_code')?.long_name,
    country: find(components, 'country')?.long_name,
    street_address: street,
  };
}
