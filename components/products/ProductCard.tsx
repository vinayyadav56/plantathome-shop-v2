'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { priceRangeLabel } from '@/lib/money';
import type { ProductCardVM } from '@/lib/hooks/useProductCards';

/** Simple hash → stable per-product pseudo-badge (no ratings in v2 catalog). */
const BADGES = ['Best Seller', 'New Arrival', 'Editor’s Pick', 'Air-Purifying'];
function badgeFor(uuid: string): string | null {
  let h = 0;
  for (const c of uuid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 3 === 0 ? BADGES[h % BADGES.length] : null;
}

function Stars() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#B58E39">
          <path d="m12 2 3 6.5 7 .8-5 4.7 1.3 7L12 17.8 5.4 21l1.3-7-5-4.7 7-.8L12 2Z" />
        </svg>
      ))}
    </span>
  );
}

export function ProductCard({ card }: { card: ProductCardVM }) {
  const badge = badgeFor(card.uuid);
  const price = priceRangeLabel(card.priceFrom, card.priceMax);

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-forest-900/10 bg-white/80 backdrop-blur-[2px] transition-all duration-300 hover:border-gold/40 hover:shadow-cardhover"
      data-product-card
    >
      <Link href={`/products/${card.uuid}`} className="relative block aspect-square overflow-hidden pa-card-art">
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image}
            alt={card.imageAlt ?? card.name}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-cormorant text-4xl text-forest-accent/40">🌿</div>
        )}

        {/* badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {badge && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-forest-900 shadow-sm">{badge}</span>}
        </div>

        {/* wishlist */}
        <button
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-forest opacity-0 shadow-sm transition group-hover:opacity-100"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.6-7-9.4A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 7 2.6C19 15.4 12 20 12 20Z" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {card.category?.name && (
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-forest-accent">{card.category.name}</p>
        )}
        <Link href={`/products/${card.uuid}`} className="line-clamp-1 text-[14px] font-semibold text-forest-900 transition hover:text-forest-700">
          {card.name}
        </Link>
        {card.botanical_name && <p className="mt-0.5 line-clamp-1 font-cormorant text-[12.5px] italic text-stone-500">{card.botanical_name}</p>}

        <div className="mt-1.5"><Stars /></div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            {price ? (
              <p className="text-[17px] font-bold text-forest-900">{price}</p>
            ) : (
              <p className="text-sm font-medium text-forest-accent">See price →</p>
            )}
          </div>
          <Link
            href={`/products/${card.uuid}`}
            className="rounded-full bg-ds-accent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition hover:brightness-110"
          >
            View
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white/80">
      <div className="aspect-square animate-pulse bg-gradient-to-br from-[#FBFCF8] to-[#E9F0E3]" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-forest-soft" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-forest-soft" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-forest-soft" />
      </div>
    </div>
  );
}
