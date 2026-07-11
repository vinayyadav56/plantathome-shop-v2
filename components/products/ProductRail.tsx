'use client';

import Link from 'next/link';
import { useBrowseCards } from '@/lib/hooks/useProductCards';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

/** A titled product section: catalog cards (images) + search prices for a category. */
export function ProductRail({
  title,
  eyebrow,
  categoryUuids,
  limit = 8,
  viewAllHref,
  viewAllLabel = 'View all',
}: {
  title: string;
  eyebrow?: string;
  categoryUuids?: string[] | null;
  limit?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  const { cards, isLoading } = useBrowseCards({ categoryUuids, limit });

  if (!isLoading && cards.length === 0) return null;

  return (
    <section className="container-wide py-14">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-accent">{eyebrow}</p>}
          <h2 className="mt-1 font-pahserif text-section font-semibold text-forest-ink">{title}</h2>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="shrink-0 text-sm font-semibold text-forest-accent hover:text-forest">
            {viewAllLabel} →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: Math.min(limit, 4) }).map((_, i) => <ProductCardSkeleton key={i} />)
          : cards.map((c) => <ProductCard key={c.uuid} card={c} />)}
      </div>
    </section>
  );
}
