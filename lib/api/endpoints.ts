import { get, getWithMeta, post, del } from './client';
import type {
  Product,
  Category,
  City,
  Availability,
  Configuration,
  Quote,
  ValidationResult,
  Cart,
  CheckoutSession,
  Order,
  SearchHit,
  SearchMeta,
  Banner,
  CmsPage,
} from './types';

/* ── Catalog ─────────────────────────────────────────────────────────────── */
export function listProducts(params: { search?: string; category?: string; limit?: number; page?: number }) {
  const q = new URLSearchParams({ status: 'published' });
  if (params.search) q.set('search', params.search);
  if (params.category) q.set('category', params.category);
  if (params.page) q.set('page', String(params.page));
  q.set('limit', String(params.limit ?? 24));
  return getWithMeta<Product[]>(`/catalog/products?${q.toString()}`);
}
export const getProduct = (idOrSlug: string) => get<Product>(`/catalog/products/${idOrSlug}`);
export const listCategories = () => get<Category[]>(`/catalog/categories`);
export const getCategory = (uuidOrSlug: string) => get<Category>(`/catalog/categories/${uuidOrSlug}`);

/* ── Search (the only public price source: price_min/max in RUPEES) ───────── */
export function searchProducts(params: { q?: string; category?: string; city?: string | null; limit?: number }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.category) qs.set('filter[category]', params.category);
  if (params.city) qs.set('city', params.city);
  qs.set('limit', String(params.limit ?? 24));
  return getWithMeta<SearchHit[]>(`/search?${qs.toString()}`) as Promise<{ data: SearchHit[]; meta: SearchMeta }>;
}
export const autocomplete = (q: string) => get<string[]>(`/search/autocomplete?q=${encodeURIComponent(q)}`);

/* ── CMS ─────────────────────────────────────────────────────────────────── */
export const listBanners = (position: string, city?: string | null) =>
  get<Banner[]>(`/cms/banners?position=${position}${city ? `&city=${city}` : ''}`);
export const getCmsPage = (slug: string, city?: string | null) =>
  get<CmsPage>(`/cms/pages/${slug}${city ? `?city=${city}` : ''}`);

/* ── Serviceability ──────────────────────────────────────────────────────── */
export const listCities = () => get<City[]>(`/serviceability/cities`);
export const getAvailability = (city: string, product: string) =>
  get<Availability>(`/serviceability/availability?city=${city}&product=${product}`);

/* ── Configuration (meta.nursery_id resolves the fulfilling vendor for a city) ─ */
export const getConfiguration = (product: string, variant: string, city: string | null) =>
  get<Configuration>(
    `/config/products/${product}/configuration?variant=${variant}${city ? `&city=${city}` : ''}`,
  );
export const validateSelection = (
  product: string,
  body: { variant: string; selection: Record<string, string[]>; city?: string | null; nursery?: string | null },
) => post<ValidationResult>(`/config/products/${product}/validate-selection`, body);

/* ── Pricing ─────────────────────────────────────────────────────────────── */
export const priceQuote = (body: {
  variant_uuid: string;
  nursery_id: string;
  qty: number;
  city?: string | null;
  options?: string[];
  coupon?: string | null;
}) => post<Quote>(`/pricing/quote`, { currency: 'INR', ...body });

/* ── Promotions ──────────────────────────────────────────────────────────── */
export const validateCoupon = (body: { code: string; subtotal_minor: number }) =>
  post<{ valid: boolean; discount_minor: number; reason?: string; code?: string }>(
    `/promotions/validate`,
    body,
  );

/* ── Cart / Checkout / Orders (all require auth) ─────────────────────────── */
export const getCart = () => get<Cart>(`/cart`);
export const addCartItem = (body: {
  variant_uuid: string;
  nursery_id: string;
  selection?: Record<string, string[]>;
  qty: number;
  city?: string | null;
}) => post<Cart>(`/cart/items`, body);
export const removeCartItem = (itemUuid: string) => del<Cart>(`/cart/items/${itemUuid}`);

export const startCheckout = (body: { address: { line1: string; city: string }; coupon?: string | null }) =>
  post<CheckoutSession>(`/checkout`, body);
export const payCheckout = (checkoutUuid: string, idempotencyKey: string) =>
  post<{ order: Order }>(`/checkout/${checkoutUuid}/pay`, { success: true }, {
    'Idempotency-Key': idempotencyKey,
  });
export const getOrder = (uuid: string) => get<Order>(`/orders/${uuid}`);
