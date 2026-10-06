'use client';

import { Icon } from '@/components/storefront/icons';
import type { PromiseItem } from '@/components/storefront/verticals';

/**
 * The vertical's three promises in a quiet cream band — the same items the
 * dark PromiseBand renders on the landing page (getVerticalMeta().promise), so
 * the claims stay in one place. Icon keys resolve through the same map.
 */
export default function ValueStrip({ items }: { items: PromiseItem[] }) {
  if (!items?.length) return null;
  return (
    <section aria-label="Our promise" className="mt-8 sm:mt-10">
      <ul className="grid gap-3 rounded-2xl border border-kraft-200 bg-cream p-4 sm:grid-cols-3 sm:gap-6 sm:p-5">
        {items.map((b) => {
          const I = Icon[b.icon];
          return (
            <li key={b.t} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-white text-forest-700 shadow-box">
                {I ? <I className="h-5 w-5" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold leading-snug text-forest-900">{b.t}</span>
                <span className="mt-0.5 block text-[12.5px] leading-5 text-stone-500">{b.d}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
