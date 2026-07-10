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
