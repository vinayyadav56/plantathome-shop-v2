'use client';
import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import type { Product } from '@/types';
import { Icon } from '../icons';
import { useTypes } from '@/framework/type';
import { useProducts } from '@/framework/product';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
// The SAME card the listing page uses. The homepage had its own `home-mini` variant, so a plant
// wore different typography and lost its Ask AI / New badges depending on which page you found it
// on. One card means one answer, and it cannot drift again.
import ProductCard from '@/components/products/cards/plantathome';



export function BestSellers({
  products,
  isLoading,
  typeSlug,
  limit = 6,
  headingLabel,
}: {
  products?: Product[];
  isLoading?: boolean;
  /** Vertical to show. Omitted → the home vertical, i.e. the old behaviour. */
  typeSlug?: string;
  limit?: number;
  /** Vertical name, so a per-vertical row can say which one it is. */
  headingLabel?: string;
}) {
  const { t } = useTranslation('common');
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const homeSlug =
    (types ?? []).find((t) => t?.settings?.isHome)?.slug ?? (types ?? [])[0]?.slug ?? 'plants';
  // Was derived internally from a useState that had no setter, so it could only
  // ever be the home vertical and the exported VerticalTabs beside it was dead
  // code. The vertical is now the caller's decision, which is what lets one
  // component serve every homepage section.
  const activeSlug = typeSlug ?? homeSlug;
  // The SSR `products` prop is prefetched for the HOME vertical only — using it
  // for any other section would show plants under a Tools heading.
  const isHomeTab = activeSlug === homeSlug;

  const { products: tabProducts, isLoading: tabLoading } = useProducts({
    type: activeSlug,
    limit: Math.max(limit, 12),
  });
  const list = ((isHomeTab && (products?.length ?? 0) > 0 ? products : tabProducts) ?? []).slice(0, limit);
  const loading = isHomeTab ? Boolean(isLoading) && list.length === 0 : tabLoading;

  return (
    <section
      style={{
        background: '#FAF9F4',
        borderTop: '1px solid #E9E3D6',
        borderBottom: '1px solid #E9E3D6',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
        paddingTop: 52,
        paddingBottom: 52,
      }}
    >
      <div className="mx-auto max-w-none px-5 sm:px-8 lg:px-16">
      {/* Wraps rather than stacks so the link stays right of the heading — see vertical-section.tsx */}
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <div
            className="font-jost text-[11px] font-bold uppercase tracking-[0.2em] text-[#4ADE80]"
            style={{ marginBottom: 9 }}
          >
            {t('home-bestsellers-eyebrow')}
          </div>
          <h2 className="m-0 whitespace-nowrap font-pahserif text-[clamp(15px,4.9vw,24px)] font-medium leading-[1.1] tracking-[-0.005em] text-forest-900 sm:text-[28px] lg:text-[34px]">
            {headingLabel ? `Our Most Loved ${headingLabel}` : t('home-bestsellers-title')}
          </h2>
        </div>
        <Link
          href={`/${activeSlug}/search`}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[14px] font-semibold text-forest-700"
        >
          {t('home-bestsellers-view-all')}
          <Icon.arrow className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="pah-rail [--rail-w:38%] lg:[--rail-w:calc((100%_-_56px)/5)] xl:[--rail-w:calc((100%_-_70px)/6)] grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-3.5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full">
                <div className="aspect-square w-full animate-pulse rounded-t-[14px] bg-[#D9EDE2]" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[#D9EDE2]" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-[#D9EDE2]" />
              </div>
            ))
          : list.map((p) => (
              <div key={p.id} className="flex">
                <ProductCard product={p} className="w-full" />
              </div>
            ))}
        {!loading && list.length === 0 && (
          <p className="pah-rail-full col-span-full w-full py-10 text-center text-[13px] text-stone-500">
            {t('home-bestsellers-empty')}
          </p>
        )}
      </div>
      </div>
    </section>
  );
}

export default BestSellers;
