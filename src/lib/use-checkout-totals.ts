import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import { useCart } from '@/store/quick-cart/cart.context';
import { calculateTotal, type Item } from '@/store/quick-cart/cart.utils';
import { couponAtom, verifiedResponseAtom } from '@/store/checkout';
import { useSettings } from '@/framework/settings';
import { formatOrderedProduct } from '@/lib/format-ordered-product';
import {
  asIdList,
  cartFingerprint,
  computeCheckoutTotals,
  invalidLineKeys,
  lineKey,
} from '@/lib/checkout-totals';

/** Verify fields the stored response type does not declare. */
type VerifiedLines = { invalid_option_lines?: unknown; invalid_variant_lines?: unknown };

/**
 * The checkout's money, computed once for everything that shows or submits it: the order summary,
 * PlaceOrderAction and the mobile checkout bar. The bar used to show the bare cart subtotal while
 * the summary showed the payable total (annotation 2026-10-16: ₹339 vs ₹388).
 */
export function useCheckoutTotals() {
  const { items } = useCart();
  const [verifiedResponse] = useAtom(verifiedResponseAtom);
  const [coupon] = useAtom(couponAtom);
  const { settings } = useSettings();
  const lines = verifiedResponse as unknown as VerifiedLines | null;

  // verified_response persists in localStorage; it is only trustworthy while the cart still
  // matches what /checkout/verify saw. A stale one (yesterday's session, edited cart) must fall
  // back to "Check availability". Responses without a fingerprint (pre-fix blobs) are stale.
  const fresh =
    !isEmpty(verifiedResponse) &&
    verifiedResponse?.__fingerprint ===
      cartFingerprint((items ?? []).map((item: Item) => formatOrderedProduct(item)));

  // unavailable_products carries PRODUCT ids while a variation cart item's id is the composite
  // "product.variation" STRING — match productId too. Ghost lines (variable product, no variation
  // picked — invalid_option_lines) are excluded exactly like unavailable ones, and so is every
  // line whose variant the server will not sell (invalid_variant_lines: missing, another
  // product's, unknown or switched off). asIdList: these fields are PHP arrays that serialise as
  // a JSON object once their keys stop being sequential, and `.includes` on an object throws.
  const unavailable = asIdList(verifiedResponse?.unavailable_products);
  const ghostLines = asIdList(lines?.invalid_option_lines);
  const badVariantLines = invalidLineKeys(lines?.invalid_variant_lines);
  const isBadVariant = (item: Item) => badVariantLines.has(lineKey(item));
  const isExcluded = (item: Item) =>
    unavailable.includes(item.id) ||
    (item.productId && unavailable.includes(item.productId)) ||
    (!item.variationId && ghostLines.includes(item.productId ?? item.id)) ||
    isBadVariant(item);
  const available_items = (items ?? []).filter((item: Item) => !isExcluded(item));

  const totals = computeCheckoutTotals({
    clientSubtotal: calculateTotal(available_items),
    verifiedAmount: verifiedResponse?.amount,
    totalTax: verifiedResponse?.total_tax,
    shippingCharge: verifiedResponse?.shipping_charge,
    coupon,
    freeShippingEnabled: settings?.freeShipping,
    freeShippingAmount: settings?.freeShippingAmount,
  });

  return { fresh, available_items, isExcluded, isBadVariant, totals };
}
