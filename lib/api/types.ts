import type { Money } from '@/lib/money';

/** Every /api/v1 response is wrapped in this envelope. */
export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: {
    pagination?: { total: number; per_page: number; current_page: number; last_page: number };
    [k: string]: unknown;
  };
  errors?: { code: string; message: string; field?: string | null }[];
};

/* ── Catalog ─────────────────────────────────────────────────────────────── */
export type Category = { uuid: string; name: string; slug: string; status?: string; parent_uuid?: string | null };
export type Variant = { uuid: string; sku?: string; size_code?: string; name?: string; weight_grams?: number };
export type Media = { url: string; type?: string; alt?: string };
export type Product = {
  uuid: string;
  name: string;
  slug: string;
  botanical_name?: string | null;
  hindi_name?: string | null;
  description?: string | null;
  care?: string | null;
  status?: string;
  category?: Category | null;
  variants?: Variant[];
  media?: Media[];
  attributes?: { code: string; value: unknown }[];
};

/* ── Serviceability ──────────────────────────────────────────────────────── */
export type City = { uuid: string; name: string; state?: string | null };

/* ── Configuration ───────────────────────────────────────────────────────── */
export type ConfigOption = {
  uuid: string;
  sku?: string;
  name: string;
  price?: Money;
  in_stock?: boolean;
  is_default?: boolean;
};
export type ConfigGroup = {
  uuid: string;
  code: string;
  name: string;
  select_type: 'single' | 'multi';
  required: boolean;
  sort: number;
  options: ConfigOption[];
};
export type Configuration = {
  meta: {
    product_uuid: string;
    variant_uuid: string;
    size_code?: string | null;
    city?: string | null;
    nursery_id?: string | null;
  };
  groups: ConfigGroup[];
};
export type ValidationResult = {
  valid: boolean;
  violations: { group: string; code: string; message: string }[];
};

/* ── Pricing ─────────────────────────────────────────────────────────────── */
export type Quote = {
  currency: string;
  qty: number;
  subtotal: Money;
  discount_total: Money;
  taxable: Money;
  gst: Money;
  gst_rate: number;
  total: Money;
  discounts?: { type: string; code?: string; amount: Money }[];
};

/* ── Cart / Checkout / Orders ────────────────────────────────────────────── */
export type CartItem = {
  uuid: string;
  variant_uuid: string;
  nursery_id: string;
  qty: number;
  options?: string[];
  price?: Money;
};
export type Cart = { uuid: string; status: string; items: CartItem[]; grand_total_minor: number };

export type Totals = { subtotal: Money; discount?: Money; grand_total: Money };
export type CheckoutSession = { checkout_uuid: string; status: string; totals: Totals; coupon?: string | null };

export type OrderItem = {
  uuid: string;
  variant_uuid: string;
  product?: { uuid: string; name: string; slug: string };
  qty: number;
  price?: Money;
};
export type SubOrder = { uuid: string; nursery_id: string; status: string; totals?: Totals; items: OrderItem[] };
export type Order = { uuid: string; status: string; totals?: Totals; sub_orders: SubOrder[] };

/* ── Identity ────────────────────────────────────────────────────────────── */
export type SessionUser = {
  uuid: string;
  name: string;
  email: string;
  role: string;
  nursery_id?: string | null;
  permissions?: string[];
  is_active?: boolean;
};
export type Tokens = { access_token: string; refresh_token: string; token_type: string; expires_in: number };
