'use client';
import React from 'react';
import Link from 'next/link';
import { useCategories } from '@/framework/category';
import { CATEGORIES_PER_PAGE } from '@/framework/client/variables';
import { useHomeConfig, applyCuration } from '@/lib/use-home-config';
import { PLACEHOLDER } from './_img';
import type { Category } from '@/types';

function Circle({ c }: { c: Category }) {
  const [err, setErr] = React.useState(false);
  const img = c?.image?.original || c?.image?.thumbnail;
  return (
    <Link href={`/c/${c.slug}`} className="flex w-16 shrink-0 flex-col items-center gap-2">
      <span className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-sage-100 shadow-[0_2px_8px_rgba(34,48,26,0.07)] transition hover:shadow-[0_8px_24px_rgba(34,48,26,0.09)] active:scale-95">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={err || !img ? PLACEHOLDER : img} alt={c.name} loading="lazy" onError={() => setErr(true)} className="absolute inset-0 h-full w-full object-cover" />
      </span>
      <span className="text-center font-hanken text-[10.5px] font-semibold leading-[1.2] text-stone-600">{c.name}</span>
    </Link>
  );
}

export function CategoryCircles() {
  const { categories, isLoading } = useCategories({ limit: CATEGORIES_PER_PAGE, parent: 'null' });
  const { homeCategories } = useHomeConfig();
  const list = applyCuration((categories ?? []).filter((c) => c?.slug), homeCategories).slice(0, 12);

  return (
    <div className="pah-scroll mb-6 flex gap-[18px] overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {isLoading && list.length === 0
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-2">
              <div className="h-16 w-16 animate-pulse rounded-full border-2 border-white bg-sage-100 shadow-[0_2px_8px_rgba(34,48,26,0.07)]" />
              <div className="h-3 w-12 animate-pulse rounded bg-sage-100" />
            </div>
          ))
        : list.map((c) => <Circle key={c.id ?? c.slug} c={c} />)}
      <Link href="/plants/search" className="flex w-16 shrink-0 flex-col items-center gap-2">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-sage-200 bg-sage-100 text-forest-700 transition hover:bg-sage-200 active:scale-95">
          <i className="fa-solid fa-table-cells-large" aria-hidden style={{ fontSize: '22px' }} />
        </span>
        <span className="text-center font-hanken text-[10.5px] font-semibold leading-[1.2] text-stone-600">View All</span>
      </Link>
    </div>
  );
}

export default CategoryCircles;
