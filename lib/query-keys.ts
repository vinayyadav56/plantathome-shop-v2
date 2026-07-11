/** Centralized query-key factory. city + nursery are threaded into the keys for
 *  config/quote/availability/cards so changing city automatically re-segments the cache. */
export const qk = {
  cities: ['cities'] as const,
  categories: ['categories'] as const,
  banners: (position: string, city: string | null) => ['banners', position, city ?? '-'] as const,
  products: (f: { search?: string; category?: string; limit?: number; page?: number }) => ['products', f] as const,
  product: (slug: string) => ['product', slug] as const,
  // browse cards: catalog images + search price, keyed on city so price re-segments
  cards: (category: string | null, city: string | null, limit: number) =>
    ['cards', category ?? '-', city ?? '-', limit] as const,
  search: (q: string, category: string | null, city: string | null, limit: number) =>
    ['search', q, category ?? '-', city ?? '-', limit] as const,
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
