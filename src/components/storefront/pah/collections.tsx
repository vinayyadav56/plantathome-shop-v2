'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useCategories } from '@/framework/category';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';
import { useHomeConfig, applyCuration } from '@/lib/use-home-config';
import { PLACEHOLDER } from './_img';
import type { Category } from '@/types';

function Card({ c }: { c: Category }) {
  const { t } = useTranslation('common');
  const [err, setErr] = React.useState(false);
  const img = c?.image?.original || c?.image?.thumbnail;
  const n = c?.products_count ?? 0;
  return (
    <Link href={`/c/${c.slug}`} className="relative block h-[180px] w-[140px] shrink-0 overflow-hidden rounded-[18px] shadow-[0_2px_8px_rgba(34,48,26,0.07)] transition hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(34,48,26,0.09)] active:scale-[0.98]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={err || !img ? PLACEHOLDER : img} alt={c.name} loading="lazy" onError={() => setErr(true)} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,30,18,0)_38%,rgba(15,30,18,0.78)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <div className="font-hanken text-[16px] font-extrabold leading-[1.1]">{c.name}</div>
        <div className="mt-[3px] text-[11px] text-white/[0.82]">{n > 0 ? `${n}+ items` : t('m-collections-card-shop-now')}</div>
      </div>
    </Link>
  );
}

export function Collections() {
  const { t } = useTranslation('common');
  const { categories, isLoading } = useCategories({ limit: CATEGORIES_PER_PAGE, parent: 'null' });
  const { homeCategories } = useHomeConfig();
  const list = applyCuration((categories ?? []).filter((c) => c?.slug), homeCategories).slice(0, 10);
  if (!isLoading && list.length === 0) return null;

  return (
    <div className="mb-7">
      <div className="mb-3.5 mt-1.5 flex items-center justify-between gap-3 px-5">
        <h2 className="flex items-center gap-1.5 font-hanken text-[18px] font-extrabold tracking-[-0.01em] text-forest-900">
          {t('m-collections-title')}
          <i className="fa-solid fa-leaf text-[15px] text-forest-500" aria-hidden />
        </h2>
        <Link href="/plants/search" className="flex shrink-0 items-center gap-[3px] text-[12.5px] font-semibold text-forest-700">
          {t('m-collections-view-all')}
          <i className="fa-solid fa-arrow-right text-[11px]" aria-hidden />
        </Link>
      </div>
      <div className="pah-scroll flex gap-3 overflow-x-auto px-5 pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading && list.length === 0
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[180px] w-[140px] shrink-0 animate-pulse rounded-[18px] bg-sage-100" />)
          : list.map((c) => <Card key={c.id ?? c.slug} c={c} />)}
      </div>
    </div>
  );
}

export default Collections;
