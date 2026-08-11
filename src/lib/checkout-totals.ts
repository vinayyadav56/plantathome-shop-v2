import { CouponType } from '@/types';
import { calculatePaidTotal } from '@/store/quick-cart/cart.utils';

/**
 * ONE source of truth for checkout money + verification freshness.
 *
 * The order summary (display) and PlaceOrderAction (submit) used to compute totals
 * independently and disagreed two ways: a percentage coupon was DISPLAYED as -N% but
 * SUBMITTED as a flat -₹N, and a free-shipping order displayed ₹0 shipping while the
 * submitted total still included the fee. Both now call computeCheckoutTotals.
 */

/** Identity of what /orders/checkout/verify actually verified: the exact product rows. */
export function cartFingerprint(products: any[]): string {
  const rows = (products ?? [])
    .map((p: any) => [
      String(p?.product_id ?? p?.id ?? ''),
      String(p?.variation_option_id ?? ''),
      Number(p?.order_quantity ?? p?.quantity ?? 1),
    ])
    .sort((a, b) => `${a[0]}:${a[1]}`.localeCompare(`${b[0]}:${b[1]}`));
  return JSON.stringify(rows);
}

export interface CheckoutTotalsInput {
  /** Client-side subtotal of the available cart items. */
  clientSubtotal: number;
  /** Server-authoritative subtotal from /checkout/verify (margin-over-cost pricing). */
  verifiedAmount?: number | null;
  totalTax?: number | null;
  shippingCharge?: number | null;
  coupon?: { type?: string; amount?: number | string } | null;
  freeShippingEnabled?: boolean;
  freeShippingAmount?: number | string | null;
}

export interface CheckoutTotals {
  subtotal: number;
  tax: number;
  /** The fee the customer actually pays (0 when threshold free shipping applies). */
  effectiveShipping: number;
  /** Whether threshold free shipping applied. */
  freeShipping: boolean;
  /** The coupon discount in currency (percentage/free-shipping resolved). */
  discount: number;
  total: number;
}

export function computeCheckoutTotals(i: CheckoutTotalsInput): CheckoutTotals {
  const subtotal =
    i.verifiedAmount != null && Number(i.verifiedAmount) > 0
      ? Number(i.verifiedAmount)
      : Number(i.clientSubtotal ?? 0);
  const tax = Number(i.totalTax ?? 0);
  const shippingCharge = Number(i.shippingCharge ?? 0);
  const freeShipping =
    Boolean(i.freeShippingEnabled) && Number(i.freeShippingAmount ?? Infinity) <= subtotal;
  const effectiveShipping = freeShipping ? 0 : shippingCharge;

  const couponAmount = Number(i.coupon?.amount ?? 0);
  let discount = 0;
  switch (i.coupon?.type) {
    case CouponType.PERCENTAGE:
      discount = (subtotal * couponAmount) / 100;
      break;
    case CouponType.FREE_SHIPPING:
      // Discount what the customer would otherwise PAY — if threshold free shipping
      // already zeroed the fee, this coupon adds nothing (never a double discount).
      discount = effectiveShipping;
      break;
    default:
      discount = couponAmount;
  }
  discount = Math.max(0, Math.round(discount * 100) / 100);

  const total = calculatePaidTotal(
    { totalAmount: subtotal, tax, shipping_charge: effectiveShipping },
    discount,
  );
  return { subtotal, tax, effectiveShipping, freeShipping, discount, total };
}
