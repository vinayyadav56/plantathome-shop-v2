'use client';

import { useBrowseCards, useSearchCards } from '@/lib/hooks/useProductCards';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

export function ProductGrid({
  search,
  categoryUuids,
  limit = 12,
  cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}: {
  search?: string;
  categoryUuids?: string[] | null;
  limit?: number;
  cols?: string;
}) {
  const browse = useBrowseCards({ categoryUuids, limit });
  const searched = useSearchCards({ q: search ?? '', limit });
  const active = search ? searched : browse;
  const { cards, isLoading, isError } = active;

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${cols}`}>
        {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <p className="rounded-card border border-clay/30 bg-clay/5 p-6 text-center text-sm text-clay">
        Couldn’t load products. Please try again.
      </p>
    );
  }
  if (cards.length === 0) {
    return <p className="py-12 text-center text-forest-ink/60">No products found here yet.</p>;
  }
  return (
    <div className={`grid gap-4 ${cols}`}>
      {cards.map((c) => (
        <ProductCard key={c.uuid} card={c} />
      ))}
    </div>
  );
}
