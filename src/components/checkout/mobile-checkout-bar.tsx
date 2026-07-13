import { useCart } from '@/store/quick-cart/cart.context';
import usePrice from '@/lib/use-price';

/**
 * Mobile-only sticky bottom bar showing the live total + a CTA that jumps to
 * the order summary (where Check Availability / Place Order live). Presentational
 * only — no checkout logic here.
 */
export default function MobileCheckoutBar() {
  const { total, isEmpty, totalUniqueItems } = useCart();
  const { price: totalPrice } = usePrice({ amount: total });

  if (isEmpty) return null;

  function scrollToSummary() {
    const el = document.querySelector('.pa-order-summary');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="pa-mcbar md:hidden">
      <div className="pa-mcbar-info">
        <span className="pa-mcbar-count">
          {totalUniqueItems} {totalUniqueItems === 1 ? 'item' : 'items'}
        </span>
        <span className="pa-mcbar-total">{totalPrice}</span>
      </div>
      <button type="button" className="pa-mcbar-cta" onClick={scrollToSummary}>
        Review &amp; Pay
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}
