/**
 * ONE status-pill language for the whole account area.
 *
 * The order journey was painted by three unrelated systems: the legacy Pickbazar
 * `StatusColor` (`bg-status-* bg-opacity-[.15]`) on /orders, `STATUS_BADGE` on
 * /my-packages, and `paymentStatusBadge()` on the tracking page. Same customer,
 * same order, three dialects. This maps every order/payment/refund status onto
 * the my-packages/tracking palette so the account area reads as one hand.
 *
 * Shape: always `rounded-full px-3 py-1 text-xs font-semibold` (PILL_BASE) —
 * never the 9px Badge chips this replaces.
 */

export const PILL_BASE = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';

const GREEN = 'bg-[var(--ds-accent-soft,#EAF4E6)] text-[var(--ds-accent-ink,#2E5E2A)]';
const AMBER = 'bg-[#FCF3E3] text-[#9A6B1F]';
const BLUE = 'bg-[#E8F0FB] text-[#1D4ED8]';
const RED = 'bg-[#FBEAEA] text-[#B23B3B]';
const NEUTRAL = 'bg-[#F8F7F2] text-stone-600';

/** order_status / payment_status / refund status → pill tone classes. */
export function statusPill(status?: string | null): string {
  const s = (status ?? '').toLowerCase().replace(/^order-|^payment-/, '');

  switch (true) {
    case /complete|delivered|approved|success|paid|^cash$/.test(s):
      return GREEN;
    case /cancel|fail|reject/.test(s):
      return RED;
    case /out-for-delivery|transit|facility|shipped/.test(s):
      return BLUE;
    case /pending|processing|cod|cash-on-delivery|await/.test(s):
      return AMBER;
    default:
      return NEUTRAL;
  }
}
