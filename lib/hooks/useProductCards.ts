'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listProducts, searchProducts } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { fromRupees, type Money } from '@/lib/money';
import { useSession } from '@/lib/store/session';
import { useVerticals } from './useVerticals';
import type { Product, SearchHit, SearchMeta } from '@/lib/api/types';

/** The union of every world's category subtree — the only categories a customer
 *  should see. Filters out prior-test junk the API can't unpublish (no status on
 *  PATCH, no delete endpoint). Empty until categories load. */
export function useLegitCategoryUuids(): Set<string> {
  const { verticals } = useVerticals();
  return useMemo(() => new Set(verticals.flatMap((v) => v.categoryUuids)), [verticals]);
}

/** The unified card view-model consumed by ProductCard everywhere. */
export type ProductCardVM = {
  uuid: string;
  name: string;
  slug: string;
  botanical_name?: string | null;
  image?: string | null;
  imageAlt?: string;
  category?: { uuid?: string; name?: string; slug?: string } | null;
  priceFrom: Money | null;
  priceMax: Money | null;
};

function priceMapFromHits(hits: SearchHit[]): Map<string, { min: Money | null; max: Money | null }> {
  const m = new Map<string, { min: Money | null; max: Money | null }>();
  for (const h of hits) m.set(h.product_uuid, { min: fromRupees(h.price_min), max: fromRupees(h.price_max) });
  return m;
}

function cardFromProduct(p: Product, price?: { min: Money | null; max: Money | null }): ProductCardVM {
  return {
    uuid: p.uuid,
    name: p.name,
    slug: p.slug,
    botanical_name: p.botanical_name,
    image: p.media?.[0]?.url ?? null,
    imageAlt: p.media?.[0]?.alt ?? p.name,
    category: p.category ?? null,
    priceFrom: price?.min ?? null,
    priceMax: price?.max ?? null,
  };
}

/** Fetches the full published catalog once (small) + a city-keyed price map. Shared
 *  cache across all browse surfaces; category filtering is done client-side because
 *  the catalog `?category=` filter is exact (no descendants) and products live in
 *  subcategories. */
function useCatalog() {
  const city = useSession((s) => s.city);
  const legit = useLegitCategoryUuids();
  const catalog = useQuery({
    queryKey: qk.products({ limit: 100 }),
    queryFn: () => listProducts({ limit: 100 }),
    staleTime: 60_000,
  });
  const prices = useQuery({
    queryKey: qk.cards(null, city, 100),
    queryFn: () => searchProducts({ city, limit: 100 }),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
  // Only surface products in a real world category (junk has none / an orphan one).
  const products = useMemo(() => {
    const all = catalog.data?.data ?? [];
    if (legit.size === 0) return all;
    return all.filter((p) => p.category?.uuid && legit.has(p.category.uuid));
  }, [catalog.data, legit]);
  return { products, catalog, prices };
}

/** Browse cards, optionally scoped to a set of category uuids (a world's whole
 *  subtree, or a single leaf). No filter → all products. */
export function useBrowseCards({ categoryUuids, limit = 12 }: { categoryUuids?: string[] | null; limit?: number }) {
  const { products: allProducts, catalog, prices } = useCatalog();

  // A passed array requests scoping; an empty array means the scope (world's
  // categories) hasn't resolved yet, so we hold rather than flash all products.
  const scoped = Array.isArray(categoryUuids);
  const scopeUnresolved = scoped && categoryUuids!.length === 0;

  const cards = useMemo<ProductCardVM[]>(() => {
    if (scopeUnresolved) return [];
    const pm = priceMapFromHits(prices.data?.data ?? []);
    const set = scoped ? new Set(categoryUuids) : null;
    const filtered = set ? allProducts.filter((p) => p.category?.uuid && set.has(p.category.uuid)) : allProducts;
    // Surface products with real imagery first (mixed-in prior seed rows lack media).
    const sorted = [...filtered].sort((a, b) => (b.media?.length ? 1 : 0) - (a.media?.length ? 1 : 0));
    return sorted.slice(0, limit).map((p) => cardFromProduct(p, pm.get(p.uuid)));
  }, [allProducts, prices.data, categoryUuids, limit, scoped, scopeUnresolved]);

  return {
    cards,
    isLoading: catalog.isLoading || (scopeUnresolved && !catalog.isError),
    isError: catalog.isError,
    priceLoading: prices.isLoading,
  };
}

/** Text search (listing page + header overlay): /search is authoritative (price +
 *  facets), catalog hydrates images. */
export function useSearchCards({ q = '', category, limit = 48 }: { q?: string; category?: string | null; limit?: number }) {
  const city = useSession((s) => s.city);
  const legit = useLegitCategoryUuids();

  const search = useQuery({
    queryKey: qk.search(q, category ?? null, city, limit),
    queryFn: () => searchProducts({ q, category: category ?? undefined, city, limit }),
    placeholderData: (prev) => prev,
  });

  // hydrate images from catalog (same query the browse path uses → cache reuse)
  const catalog = useQuery({
    queryKey: qk.products({ search: q || undefined, category: category ?? undefined, limit: 100 }),
    queryFn: () => listProducts({ search: q || undefined, category: category ?? undefined, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const { cards, meta } = useMemo(() => {
    const hits = search.data?.data ?? [];
    const rawMeta = (search.data?.meta ?? {}) as SearchMeta;
    const imgByUuid = new Map<string, Product>();
    for (const p of catalog.data?.data ?? []) imgByUuid.set(p.uuid, p);

    // Keep only hits that map to a real, legit-category catalog product (drops the
    // stale-projection junk that lingers in the search index).
    const kept = hits.filter((h) => {
      const p = imgByUuid.get(h.product_uuid);
      return p && (legit.size === 0 || (p.category?.uuid ? legit.has(p.category.uuid) : false));
    });
    const cards: ProductCardVM[] = kept
      .sort((a, b) => (imgByUuid.get(b.product_uuid)?.media?.length ? 1 : 0) - (imgByUuid.get(a.product_uuid)?.media?.length ? 1 : 0))
      .map((h) => {
        const p = imgByUuid.get(h.product_uuid)!;
        return {
          uuid: h.product_uuid,
          name: h.name,
          slug: h.slug,
          botanical_name: p.botanical_name ?? null,
          image: p.media?.[0]?.url ?? null,
          imageAlt: p.media?.[0]?.alt ?? h.name,
          category: h.category ?? p.category ?? null,
          priceFrom: fromRupees(h.price_min),
          priceMax: fromRupees(h.price_max),
        };
      });
    // Facets filtered to legit categories only.
    const facets = (rawMeta.facets?.category ?? []).filter((f) => legit.size === 0 || legit.has(f.uuid));
    const meta: SearchMeta = { ...rawMeta, total: cards.length, facets: { category: facets } };
    return { cards, meta };
  }, [search.data, catalog.data, legit]);

  return { cards, meta, isLoading: search.isLoading, isError: search.isError };
}
