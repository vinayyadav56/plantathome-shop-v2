import { Playfair_Display } from 'next/font/google';

/**
 * The PLP's display serif, scoped to that page: the route wraps the body in
 * `<div className={plpSerif.variable}>` and headings opt in with
 * `font-[family-name:var(--font-plp-serif)]`. Nothing else on the site changes
 * (site-wide "serif" classes still resolve to the admin design system).
 * Variable font ⇒ no `weight` list needed.
 */
export const plpSerif = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plp-serif',
});
