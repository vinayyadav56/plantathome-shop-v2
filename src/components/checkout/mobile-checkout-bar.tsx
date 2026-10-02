import { useEffect, useState } from 'react';
import { useCart } from '@/store/quick-cart/cart.context';
import usePrice from '@/lib/use-price';
import { ArrowRight } from '@/components/ui/icon';

/**
 * Mobile-only sticky bottom bar showing the live total + a CTA that jumps to
 * the order summary (where Check Availability / Place Order live). Presentational
 * only — no checkout logic here.
 *
 * One CTA at a time (annotation 2026-10-03: "Review & Pay AND Place order both
 * are coming"): while the order summary — which contains the real action
 * button — is on screen, this bar slides away. IntersectionObserver, not
 * scroll math, so it tracks layout changes for free.
 */
export default function MobileCheckoutBar() {
  const { total, isEmpty, totalUniqueItems } = useCart();
  const { price: totalPrice } = usePrice({ amount: total });
  const [summaryVisible, setSummaryVisible] = useState(false);

  useEffect(() => {
    // Watch the REAL action button, not the summary card: the card's header
    // peeks into the first viewport long before its CTA does, and hiding this
    // bar then leaves the shopper with no CTA at all. The bar yields only once
    // the actual Place-Order/Check-Availability button is mostly readable.
    const el =
      document.querySelector('.pa-place-order-btn') ??
      document.querySelector('.pa-order-summary');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setSummaryVisible(entry.isIntersecting),
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isEmpty]);

  if (isEmpty) return null;

  function scrollToSummary() {
    const el = document.querySelector('.pa-order-summary');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div
      className={`pa-mcbar transition-transform duration-300 md:hidden ${
        summaryVisible ? 'translate-y-full' : ''
      }`}
      aria-hidden={summaryVisible}
    >
      <div className="pa-mcbar-info">
        <span className="pa-mcbar-count">
          {totalUniqueItems} {totalUniqueItems === 1 ? 'item' : 'items'}
        </span>
        <span className="pa-mcbar-total">{totalPrice}</span>
      </div>
      <button type="button" className="pa-mcbar-cta" onClick={scrollToSummary} tabIndex={summaryVisible ? -1 : 0}>
        Review &amp; Pay
        <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );
}
