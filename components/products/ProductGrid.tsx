'use client';

import { useQuery } from '@tanstack/react-query';
import { listProducts } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { ProductCard } from './ProductCard';

export function ProductGrid({
  search,
  category,
  limit = 24,
}: {
  search?: string;
  category?: string;
  limit?: number;
}) {
  const filters = { search, category, limit };
  const { data, isLoading, isError, error } = useQuery({
    queryKey: qk.products(filters),
    queryFn: () => listProducts(filters),
    placeholderData: (prev) => prev,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-square bg-forest-soft/60" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 rounded bg-forest-soft" />
              <div className="h-4 w-2/3 rounded bg-forest-soft" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-card border border-clay/30 bg-clay/5 p-6 text-center text-sm text-clay">
        Couldn&apos;t load products{error instanceof Error ? `: ${error.message}` : ''}.
      </p>
    );
  }

  const products = data?.data ?? [];
  if (products.length === 0) {
    return <p className="py-12 text-center text-forest-ink/60">No plants found. Try another search.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.uuid} product={p} />
      ))}
    </div>
  );
}
