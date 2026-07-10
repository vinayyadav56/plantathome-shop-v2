/** Centralized query-key factory. city + nursery are threaded into the keys for
 *  config/quote/availability so changing city automatically re-segments the cache. */
export const qk = {
  cities: ['cities'] as const,
  products: (f: { search?: string; category?: string; limit?: number }) => ['products', f] as const,
  product: (slug: string) => ['product', slug] as const,
  availability: (city: string, product: string) => ['availability', city, product] as const,
  config: (product: string, variant: string, city: string | null) =>
    ['config', product, variant, city ?? '-'] as const,
  quote: (
    variant: string,
    nursery: string | null,
    city: string | null,
    qty: number,
    options: string[],
    coupon?: string | null,
  ) => ['quote', variant, nursery ?? '-', city ?? '-', qty, [...options].sort(), coupon ?? null] as const,
  cart: ['cart'] as const,
  me: ['me'] as const,
  order: (uuid: string) => ['order', uuid] as const,
};
