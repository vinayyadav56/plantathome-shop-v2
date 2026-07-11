export type Money = { amount_minor: number; currency: string; amount?: string | number };

/** Format integer minor units (paise) to a localized currency string. Never
 *  do float math on the paise elsewhere — carry amount_minor and format at the edge. */
export function formatMoney(m: Money | null | undefined): string {
  if (!m || typeof m.amount_minor !== 'number') return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: m.currency || 'INR',
    maximumFractionDigits: 2,
  }).format(m.amount_minor / 100);
}

export const minor = (m?: Money | null): number => m?.amount_minor ?? 0;

/** Build a Money from a rupee (major-unit) value — used for /search price_min/max,
 *  which the backend returns as decimal RUPEES (e.g. "349.00"), not paise. */
export function fromRupees(n: number | string | null | undefined, currency = 'INR'): Money | null {
  if (n == null || n === '') return null;
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (!Number.isFinite(v)) return null;
  return { amount_minor: Math.round(v * 100), currency };
}

/** "from ₹349" style label for a price range on a card. */
export function priceRangeLabel(min?: Money | null, max?: Money | null): string {
  if (!min) return '';
  const lo = formatMoney(min);
  if (max && max.amount_minor > min.amount_minor) return `from ${lo}`;
  return lo;
}
