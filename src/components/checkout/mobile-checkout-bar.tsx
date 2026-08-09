import { useCart } from '@/store/quick-cart/cart.context';
import usePrice from '@/lib/use-price';
import { ArrowRight } from '@/components/ui/icon';

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
        <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );
}
