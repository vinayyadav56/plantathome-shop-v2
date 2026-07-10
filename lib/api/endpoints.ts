import { get, getWithMeta, post, del } from './client';
import type {
  Product,
  Category,
  City,
  Configuration,
  Quote,
  ValidationResult,
  Cart,
  CheckoutSession,
  Order,
} from './types';

/* ── Catalog ─────────────────────────────────────────────────────────────── */
export function listProducts(params: { search?: string; category?: string; limit?: number }) {
  const q = new URLSearchParams({ status: 'published' });
  if (params.search) q.set('search', params.search);
  if (params.category) q.set('category', params.category);
  q.set('limit', String(params.limit ?? 24));
  return getWithMeta<Product[]>(`/catalog/products?${q.toString()}`);
}
export const getProduct = (idOrSlug: string) => get<Product>(`/catalog/products/${idOrSlug}`);
export const listCategories = () => get<Category[]>(`/catalog/categories`);

/* ── Serviceability ──────────────────────────────────────────────────────── */
export const listCities = () => get<City[]>(`/serviceability/cities`);

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
