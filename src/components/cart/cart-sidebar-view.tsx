import { useRouter } from '@/compat/next-router';
import { motion } from 'framer-motion';
import CartItem from '@/components/cart/cart-item';
import { fadeInOut } from '@/lib/motion/fade-in-out';
import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';
import { checkoutRouteFor } from '@/lib/checkout-route';
import usePrice from '@/lib/use-price';
import { useCart } from '@/store/quick-cart/cart.context';
import { useSettings } from '@/framework/settings';
import { formatString } from '@/lib/format-string';
import { useTranslation } from 'next-i18next';
import { useAtom } from 'jotai';
import { drawerAtom } from '@/store/drawer-atom';
import { Check, Clock, Lock, ShoppingBag, Truck, X } from '@/components/ui/icon';


const CartSidebarView = () => {
  const { t } = useTranslation('common');
  const { items, totalUniqueItems, total, language } = useCart();
  const { settings }: any = useSettings();
  const [_, closeSidebar] = useAtom(drawerAtom);
  const router = useRouter();

  function handleCheckout() {
    router.push(checkoutRouteFor(items), undefined, { locale: language });
    closeSidebar({ display: false, view: '' });
  }

  function handleBrowse() {
    closeSidebar({ display: false, view: '' });
    router.push('/');
  }

  // Free delivery is an admin setting and production runs with it OFF. The
  // threshold used to be a hard-coded 999 here, so the drawer promised
  // "You've unlocked FREE delivery!" and showed Delivery: FREE on a store that
  // then charged for it at checkout. page-bodies/cart.tsx was fixed in 1d3b775;
  // this caller was missed. Same gate, same source of truth.
  const freeDeliveryOffered =
    Boolean(settings?.freeShipping) && Number(settings?.freeShippingAmount) > 0;
  const FREE_DELIVERY_THRESHOLD = Number(settings?.freeShippingAmount) || 0;

  const { price: totalPrice } = usePrice({ amount: total });
  const { price: deliveryThresholdPrice } = usePrice({ amount: FREE_DELIVERY_THRESHOLD });

  const remaining = freeDeliveryOffered ? Math.max(0, FREE_DELIVERY_THRESHOLD - total) : 0;
  const { price: remainingPrice } = usePrice({ amount: remaining });
  const progress = freeDeliveryOffered ? Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100) : 0;
  const isFreeDelivery = freeDeliveryOffered && total >= FREE_DELIVERY_THRESHOLD;

  // Subtotal == total (delivery calculated at checkout)
  const { price: subtotalPrice } = usePrice({ amount: total });

  return (
    <section className="pa-cart-sidebar">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="pa-cart-header">
        <div className="pa-cart-header-left">
          <div className="pa-cart-header-icon">
            <ShoppingBag size={18} className="text-white" aria-hidden />
          </div>
          <div>
            <h2 className="pa-cart-header-title">Your Cart</h2>
            <p className="pa-cart-header-count">
              {totalUniqueItems === 0
                ? 'Empty'
                : formatString(totalUniqueItems, t('text-item'))}
            </p>
          </div>
        </div>
        <button
          className="pa-cart-close-btn"
          onClick={() => closeSidebar({ display: false, view: '' })}
          aria-label="Close cart"
        >
          <X size={12} aria-hidden />
        </button>
      </header>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div className="pa-cart-body">
        {items.length > 0 ? (
          <>
            {/* Free delivery progress bar — only when the store offers it */}
            {freeDeliveryOffered && (
            <div className="pa-cart-delivery-bar">
              <p className={`pa-cart-delivery-label${isFreeDelivery ? ' is-free' : ''}`}>
                {isFreeDelivery ? (
                  <>
                    <Check size={14} aria-hidden />
                    You've unlocked FREE delivery! 🎉
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

            {/* Cart items */}
            {items.map((item) => (
              <CartItem item={item} key={item.id} />
            ))}

            {/* Order summary */}
            <div className="pa-cart-summary">
              <div className="pa-cart-summary-row">
                <span>Subtotal ({formatString(totalUniqueItems, t('text-item'))})</span>
                <span>{subtotalPrice}</span>
              </div>
              <div className="pa-cart-summary-row">
                <span>Delivery</span>
                <span className={isFreeDelivery ? 'pa-cart-summary-free' : ''}>
                  {isFreeDelivery ? 'FREE' : `Calculated at checkout`}
                </span>
              </div>
              <div className="pa-cart-summary-row total">
                <span>Total</span>
                <span>{totalPrice}</span>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            layout
            initial="from"
            animate="to"
            exit="from"
            variants={fadeInOut(0.25)}
            className="pa-cart-empty"
          >
            <div className="pa-cart-empty-icon">
              <ShoppingBag size={40} style={{ color: '#2C5F2E' }} aria-hidden />
            </div>
            <h3 className="pa-cart-empty-title">Your cart is empty</h3>
            <p className="pa-cart-empty-sub">
              Looks like you haven't added any plants yet.
              <br />Start exploring our collection!
            </p>
            <button className="pa-cart-browse-btn" onClick={handleBrowse}>
              <Clock size={14} aria-hidden />
              Browse Plants
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      {items.length > 0 && (
        <footer className="pa-cart-footer">
          <button className="pa-cart-checkout-btn" onClick={handleCheckout}>
            <span>Proceed to Checkout</span>
            <span className="pa-cart-checkout-price">{totalPrice}</span>
          </button>
          {/* The drawer is add-to-cart confirmation; /cart is the full page. */}
          <Link
            href={Routes.cart}
            onClick={() => closeSidebar({ display: false, view: '' })}
            className="mt-2 block text-center text-[13px] font-medium text-forest-700 underline underline-offset-2 hover:text-forest-900"
          >
            View full cart
          </Link>
          <p className="pa-cart-secure">
            <Lock size={12} aria-hidden />
            Secure checkout · 7-day easy returns
          </p>
        </footer>
      )}
    </section>
  );
};

export default CartSidebarView;
