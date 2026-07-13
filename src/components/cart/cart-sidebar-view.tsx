import { useRouter } from '@/compat/next-router';
import { motion } from 'framer-motion';
import CartItem from '@/components/cart/cart-item';
import { fadeInOut } from '@/lib/motion/fade-in-out';
import { Routes } from '@/config/routes';
import usePrice from '@/lib/use-price';
import { useCart } from '@/store/quick-cart/cart.context';
import { formatString } from '@/lib/format-string';
import { useTranslation } from 'next-i18next';
import { useAtom } from 'jotai';
import { drawerAtom } from '@/store/drawer-atom';

const FREE_DELIVERY_THRESHOLD = 999;

const CartSidebarView = () => {
  const { t } = useTranslation('common');
  const { items, totalUniqueItems, total, language } = useCart();
  const [_, closeSidebar] = useAtom(drawerAtom);
  const router = useRouter();

  function handleCheckout() {
    const isRegularCheckout = items.find((item) => !Boolean(item.is_digital));
    router.push(
      isRegularCheckout ? Routes.checkout : Routes.checkoutDigital,
      undefined,
      { locale: language },
    );
    closeSidebar({ display: false, view: '' });
  }

  function handleBrowse() {
    closeSidebar({ display: false, view: '' });
    router.push('/');
  }

  const { price: totalPrice } = usePrice({ amount: total });
  const { price: deliveryThresholdPrice } = usePrice({ amount: FREE_DELIVERY_THRESHOLD });

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total);
  const { price: remainingPrice } = usePrice({ amount: remaining });
  const progress = Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100);
  const isFreeDelivery = total >= FREE_DELIVERY_THRESHOLD;

  // Subtotal == total (delivery calculated at checkout)
  const { price: subtotalPrice } = usePrice({ amount: total });

  return (
    <section className="pa-cart-sidebar">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="pa-cart-header">
        <div className="pa-cart-header-left">
          <div className="pa-cart-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
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
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </button>
      </header>

      {/* ── Scrollable body ─────────────────────────────────────── */}
      <div className="pa-cart-body">
        {items.length > 0 ? (
          <>
            {/* Free delivery progress bar */}
            <div className="pa-cart-delivery-bar">
              <p className={`pa-cart-delivery-label${isFreeDelivery ? ' is-free' : ''}`}>
                {isFreeDelivery ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    You've unlocked FREE delivery! 🎉
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h5l2 4v4h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                    Add {remainingPrice} more for FREE delivery
                  </>
                )}
              </p>
              <div className="pa-delivery-track">
                <div className="pa-delivery-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

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
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2C5F2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h3 className="pa-cart-empty-title">Your cart is empty</h3>
            <p className="pa-cart-empty-sub">
              Looks like you haven't added any plants yet.
              <br />Start exploring our collection!
            </p>
            <button className="pa-cart-browse-btn" onClick={handleBrowse}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                <path d="M12 8v4l3 3"/>
              </svg>
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
          <p className="pa-cart-secure">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secure checkout · 7-day easy returns
          </p>
        </footer>
      )}
    </section>
  );
};

export default CartSidebarView;
