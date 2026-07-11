'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { useVerticals } from '@/lib/hooks/useVerticals';
import { useCategoryTree } from '@/lib/hooks/useCategoryTree';
import { useBrowseCards, useSearchCards, type ProductCardVM } from '@/lib/hooks/useProductCards';
import { minor } from '@/lib/money';

type Sort = 'new' | 'price-asc' | 'price-desc';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'new', label: 'Newest' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
];

function subtree(bySlug: Map<string, { uuid: string; children: { uuid: string }[] }>, slug: string): string[] {
  const node = bySlug.get(slug);
  if (!node) return [];
  const walk = (n: { uuid: string; children: any[] }): string[] => [n.uuid, ...n.children.flatMap(walk)];
  return walk(node as any);
}

export function ProductListing() {
  const router = useRouter();
  const params = useSearchParams();
  const search = params.get('search') ?? '';
  const categorySlug = params.get('category') ?? '';
  const worldSlug = params.get('world') ?? '';

  const { verticals } = useVerticals();
  const { bySlug } = useCategoryTree();
  const [sort, setSort] = useState<Sort>('new');
  const [shown, setShown] = useState(24);

  // Resolve active category scope
  const scopeUuids = useMemo(() => {
    if (categorySlug) return subtree(bySlug as any, categorySlug);
    if (worldSlug) return verticals.find((v) => v.key === worldSlug)?.categoryUuids ?? [];
    return undefined;
  }, [categorySlug, worldSlug, bySlug, verticals]);

  const browse = useBrowseCards({ categoryUuids: scopeUuids ?? null, limit: 200 });
  const searched = useSearchCards({ q: search, limit: 100 });
  const active = search ? searched : browse;

  const sorted = useMemo(() => {
    const list = [...active.cards];
    if (sort === 'price-asc') list.sort((a, b) => minor(a.priceFrom) - minor(b.priceFrom));
    else if (sort === 'price-desc') list.sort((a, b) => minor(b.priceFrom) - minor(a.priceFrom));
    return list;
  }, [active.cards, sort]);

  const visible = sorted.slice(0, shown);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // category/world are mutually exclusive scopes
    if (key === 'category') next.delete('world');
    if (key === 'world') next.delete('category');
    router.push(`/products?${next.toString()}`);
    setShown(24);
  }

  const hasFilters = !!(search || categorySlug || worldSlug);

  return (
    <div className="container-wide py-10">
      <div className="mb-6">
        <h1 className="font-pahserif text-section font-semibold text-forest-ink">
          {search ? `Results for “${search}”` : worldSlug ? verticals.find((v) => v.key === worldSlug)?.label ?? 'Shop' : categorySlug ? bySlug.get(categorySlug)?.name ?? 'Shop' : 'Shop everything'}
        </h1>
        <p className="mt-1 text-forest-ink/60">{active.isLoading ? 'Loading…' : `${sorted.length} products`}</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24 space-y-6 rounded-2xl border border-forest/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-forest-ink">Filter</h2>
              {hasFilters && (
                <button onClick={() => router.push('/products')} className="text-xs font-medium text-forest-accent hover:text-forest">Clear all</button>
              )}
            </div>

            {/* search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setParam('search', new FormData(e.currentTarget).get('q')?.toString().trim() ?? '');
              }}
            >
              <input name="q" defaultValue={search} placeholder="Search products…" className="w-full rounded-xl border-forest/20 bg-cream/40 py-2 text-sm focus:border-forest-accent focus:ring-forest-accent/20" />
            </form>

            {/* categories */}
            <div className="border-t border-forest/10 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-forest-ink/50">Worlds</p>
              <ul className="space-y-3 text-sm">
                {verticals.filter((v) => !v.isComingSoon).map((v) => (
                  <li key={v.key}>
                    <button
                      onClick={() => setParam('world', worldSlug === v.key ? '' : v.key)}
                      className={`font-medium ${worldSlug === v.key ? 'text-forest' : 'text-forest-ink/80 hover:text-forest'}`}
                    >
                      {v.label}
                    </button>
                    {v.subcategories.length > 0 && (
                      <ul className="ml-3 mt-1.5 space-y-1.5 border-l border-forest/10 pl-3 text-[13px]">
                        {v.subcategories.map((c) => (
                          <li key={c.uuid}>
                            <button
                              onClick={() => setParam('category', categorySlug === c.slug ? '' : c.slug)}
                              className={categorySlug === c.slug ? 'font-semibold text-forest-accent' : 'text-forest-ink/60 hover:text-forest'}
                            >
                              {c.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {hasFilters && (
                <>
                  {search && <Chip label={`“${search}”`} onClear={() => setParam('search', '')} />}
                  {worldSlug && <Chip label={verticals.find((v) => v.key === worldSlug)?.label ?? worldSlug} onClear={() => setParam('world', '')} />}
                  {categorySlug && <Chip label={bySlug.get(categorySlug)?.name ?? categorySlug} onClear={() => setParam('category', '')} />}
                </>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-forest-ink/70">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border-forest/20 bg-white py-1.5 text-sm focus:border-forest-accent focus:ring-0">
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {active.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {visible.map((c: ProductCardVM) => <ProductCard key={c.uuid} card={c} />)}
              </div>
              {shown < sorted.length && (
                <div className="mt-10 text-center">
                  <button onClick={() => setShown((s) => s + 24)} className="pa-btn pa-btn-secondary">Load more</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-3 py-1 text-xs font-medium text-forest">
      {label}
      <button onClick={onClear} aria-label="Remove filter" className="text-forest/60 hover:text-forest">×</button>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-forest/20 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-soft text-3xl">🪴</div>
      <p className="font-heading text-2xl text-forest-ink">No products match</p>
      <p className="max-w-sm text-sm text-forest-ink/60">Try a different search or clear your filters to see everything.</p>
      <Link href="/products" className="btn-cta px-6 py-2.5">Browse all</Link>
    </div>
  );
}
