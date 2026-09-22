'use client';

import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import Link from '@/components/ui/link';
import Seo from '@/components/seo/seo';
import CartItem from '@/components/cart/cart-item';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';
import { Check, Lock, ShoppingBag, Truck } from '@/components/ui/icon';
import { Routes } from '@/config/routes';
import { useSettings } from '@/framework/settings';
import { checkoutRouteFor } from '@/lib/checkout-route';
import { formatString } from '@/lib/format-string';
import usePrice from '@/lib/use-price';
import { useCart } from '@/store/quick-cart/cart.context';
import { useCartDeliveryPreview } from '@/framework/order';

/**
 * /cart — the dedicated cart page (annotation: "remove [the floating cart
 * button] and create a dedicated cart page").
 *
 * The slide-out drawer stays as add-to-cart confirmation; the header icon and
 * the drawer's "View full cart" link land here. Same store, same CartItem row
 * and the same checkout rule (checkoutRouteFor) as the drawer, so the two can
 * never disagree. One deliberate difference: the free-delivery threshold is
 * read from the admin setting here (the drawer still hard-codes 999).
 *
 * Delivery is quoted by /orders/checkout/verify rather than summed here -- see
 * useCartDeliveryPreview. Since delivery went per-size (Small 100 / Medium 150 /
 * Large 200, per unit) a two-plant cart can carry a three-figure delivery charge,
 * and "Calculated at checkout" meant the shopper first saw it on the pay screen.
 */
export default function CartPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { settings }: any = useSettings();
  const { items, totalUniqueItems, total, language } = useCart();

  // Only promise free delivery when the store actually offers it. This used to
  // fall back to a hard-coded 999 threshold whenever the setting was unset, so
  // with free shipping switched OFF -- which is how production runs -- the bar
  // still told the shopper they had "unlocked FREE delivery" and checkout then
  // charged them for it. Every other surface already gates on settings.freeShipping.
  const freeDeliveryOffered = Boolean(settings?.freeShipping) && Number(settings?.freeShippingAmount) > 0;
  const threshold = Number(settings?.freeShippingAmount);
  const isFreeDelivery = freeDeliveryOffered && total >= threshold;
  const remaining = freeDeliveryOffered ? Math.max(0, threshold - total) : 0;
  const progress = freeDeliveryOffered ? Math.min(100, (total / threshold) * 100) : 0;

  // Server-quoted, so it already accounts for the threshold above, the delivery
  // optimizer's flat fee, and the per-size sum -- in that order of precedence.
  const { deliveryFee, pricesIncludeTax, isLoading: deliveryLoading } = useCartDeliveryPreview();
  const hasQuote = deliveryFee !== null;

  const { price: totalPrice } = usePrice({ amount: total });
  const { price: remainingPrice } = usePrice({ amount: remaining });
  const { price: deliveryPrice } = usePrice({ amount: deliveryFee ?? 0 });
  const { price: grandTotalPrice } = usePrice({ amount: total + (deliveryFee ?? 0) });

  const isEmpty = items.length === 0;

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <div className="w-full g-light-a">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-600">Your cart</p>
          <h1 className="mt-1 font-cormorant text-3xl font-medium text-forest-900 md:text-4xl">
            {isEmpty ? 'Nothing here yet' : formatString(totalUniqueItems, t('text-item'))}
          </h1>

          {isEmpty ? (
            <div className="pa-cart-empty mt-8 rounded-xl border border-forest-900/10 bg-white">
              <div className="pa-cart-empty-icon">
                <ShoppingBag size={40} style={{ color: '#2C5F2E' }} aria-hidden />
              </div>
              <h2 className="pa-cart-empty-title">Your cart is empty</h2>
              <p className="pa-cart-empty-sub">
                Looks like you haven't added any plants yet.
                <br />
                Start exploring our collection!
              </p>
              <Link href={Routes.home} className="pa-cart-browse-btn">
                Browse plants
              </Link>
            </div>
          ) : (
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
              {/* items */}
              <div className="w-full lg:max-w-2xl">
                {freeDeliveryOffered && (
                <div className="pa-cart-delivery-bar rounded-xl border border-forest-900/10 bg-white">
                  <p className={`pa-cart-delivery-label${isFreeDelivery ? ' is-free' : ''}`}>
                    {isFreeDelivery ? (
                      <>
                        <Check size={14} aria-hidden />
                        You've unlocked FREE delivery!
                      </>
                    ) : (
                      <>
                        <Truck size={14} aria-hidden />
                        Add {remainingPrice} more for FREE delivery
                      </>
                    )}
                  </p>
                  <div className="pa-delivery-track">
                    <div className="pa-delivery-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                )}

                <div className="mt-4 rounded-xl border border-forest-900/10 bg-white px-4">
                  {items.map((item) => (
                    <CartItem item={item} key={item.id} />
                  ))}
                </div>
              </div>

              {/* summary */}
              <aside className="w-full lg:sticky lg:top-28 lg:w-96">
                <div className="rounded-xl border border-forest-900/10 bg-white p-5">
                  <div className="pa-cart-summary">
                    <div className="pa-cart-summary-row">
                      <span>Subtotal ({formatString(totalUniqueItems, t('text-item'))})</span>
                      <span>{totalPrice}</span>
                    </div>
                    <div className="pa-cart-summary-row">
                      <span>
                        Delivery
                        {hasQuote && deliveryFee > 0 && (
                          <span className="block text-[11px] font-normal text-forest-900/50">
                            Charged per plant by size
                          </span>
                        )}
                      </span>
                      <span className={hasQuote && deliveryFee === 0 ? 'pa-cart-summary-free' : ''}>
                        {hasQuote
                          ? deliveryFee === 0
                            ? 'FREE'
                            : deliveryPrice
                          : deliveryLoading
                            ? 'Calculating…'
                            : 'Calculated at checkout'}
                      </span>
                    </div>
                    <div className="pa-cart-summary-row total">
                      <span>Total</span>
                      <span>{hasQuote ? grandTotalPrice : totalPrice}</span>
                    </div>
                    {hasQuote && pricesIncludeTax && (
                      <p className="mt-1 text-[11px] text-forest-900/50">
                        Taxes are included in the prices shown.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="pa-cart-checkout-btn mt-4"
                    onClick={() => router.push(checkoutRouteFor(items), undefined, { locale: language })}
                  >
                    <span>Proceed to Checkout</span>
                    <span className="pa-cart-checkout-price">{totalPrice}</span>
                  </button>
                  <p className="pa-cart-secure">
                    <Lock size={12} aria-hidden />
                    Secure checkout · 7-day easy returns
                  </p>
                  <Link
                    href={Routes.home}
                    className="mt-3 block text-center text-[13px] font-medium text-forest-700 underline underline-offset-2 hover:text-forest-900"
                  >
                    Continue shopping
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

CartPage.getLayout = getLayoutWithFooter;

/* ── App Router body wrapper (mirrors the other page-bodies) ── */
export function PageBody(props: any) {
  const page = <CartPage {...props} />;
  const withLayout = (CartPage as any).getLayout ? (CartPage as any).getLayout(page) : page;
  return withLayout;
}
