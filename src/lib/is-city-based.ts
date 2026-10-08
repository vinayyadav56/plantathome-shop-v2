/**
 * City-based = sold by the shopper city's vendors (Plants). The API sends
 * `city_based: false` for nationwide single-seller products (Tools): one seller,
 * one price everywhere, so no city-supply / "in {city}" gate applies to them —
 * only their own `in_stock` does. A missing flag (older API, older persisted
 * cart line) keeps today's city-based behaviour.
 */
export function isCityBased(p?: { city_based?: boolean | null } | null): boolean {
  return p?.city_based !== false;
}

/** A nationwide product whose seller has no rate/stock yet. Never true for a
 *  city-based product — their stock is per city and handled by the city gates. */
export function isNationwideOutOfStock(p?: { city_based?: boolean | null; in_stock?: unknown } | null): boolean {
  // in_stock is a tinyint column: the API may send 0 rather than false.
  return !isCityBased(p) && (p?.in_stock === false || p?.in_stock === 0);
}

/** Checkout keeps the shopping-city gates while ANY line is city-based. An empty
 *  (or not yet hydrated) cart keeps them too, so they never flicker off. */
export function isCityGatedCart(items?: ReadonlyArray<object> | null): boolean {
  return !items?.length || items.some((i) => isCityBased(i as { city_based?: boolean }));
}
