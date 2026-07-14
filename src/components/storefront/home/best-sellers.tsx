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
import ProductCard from '@/components/products/cards/home-mini';



/** Vertical tab pills — lets the home sell all three worlds, not just plants. */
export function VerticalTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (slug: string) => void;
}) {
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const list = (types ?? []).slice(0, 3);
  if (list.length < 2) return null;
  return (
    <div className="mt-5 flex justify-center">
      <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-forest-900/10 bg-white/75 p-1.5 backdrop-blur-[2px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((t) => {
          const on = t.slug === active;
          return (
            <button
              key={t.slug}
              type="button"
              onClick={() => onChange(t.slug)}
              className={`shrink-0 rounded-full px-5 py-2 text-[11.5px] font-bold uppercase tracking-[0.12em] transition ${
                on
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'text-forest-800/75 hover:text-forest-900'
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BestSellers({
  products,
  isLoading,
}: {
  products?: Product[];
  isLoading?: boolean;
}) {
  const { t } = useTranslation('common');
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const homeSlug =
    (types ?? []).find((t) => t?.settings?.isHome)?.slug ?? (types ?? [])[0]?.slug ?? 'plants';
  const [picked] = React.useState<string | null>(null);
  const activeSlug = picked ?? homeSlug;
  const isHomeTab = activeSlug === homeSlug;

  // SSR prop already covers the home vertical; other tabs fetch via the same hook.
  const { products: tabProducts, isLoading: tabLoading } = useProducts({
    type: activeSlug,
    limit: 12,
  });
  const list = ((isHomeTab && (products?.length ?? 0) > 0 ? products : tabProducts) ?? []).slice(0, 6);
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
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-16">
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div
            className="font-jost text-[11px] font-bold uppercase tracking-[0.2em] text-[#4ADE80]"
            style={{ marginBottom: 9 }}
          >
            {t('home-bestsellers-eyebrow')}
          </div>
          <h2 className="m-0 font-pahserif text-[26px] font-semibold leading-[1.05] tracking-[-0.005em] text-forest-900 sm:text-[34px]">
            {t('home-bestsellers-title')}
          </h2>
        </div>
        <Link
          href="/plants/search"
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
          <p className="col-span-full w-full py-10 text-center text-[13px] text-stone-500">
            {t('home-bestsellers-empty')}
          </p>
        )}
      </div>
      </div>
    </section>
  );
}

export default BestSellers;
