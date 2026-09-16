import { Routes } from '@/config/routes';

/**
 * Regular vs digital-only checkout — one rule shared by the cart drawer and the
 * /cart page so the two can never disagree about where "Proceed" goes.
 */
export function checkoutRouteFor(items: { is_digital?: boolean; [key: string]: unknown }[]): string {
  return items.some((item) => !item.is_digital) ? Routes.checkout : Routes.checkoutDigital;
}
