'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import { getVerticalMeta } from '@/components/storefront/verticals';

/**
 * Mobile counterpart of the desktop "all our worlds" verticals band — a compact
 * swipeable rail of every vertical (type), matching the pah home aesthetic.
 * Same data path as desktop: API types (city-aware) + storefront/verticals.ts
 * visuals, so it works on any catalogue.
 */
export function VerticalsRail() {
  const { t } = useTranslation('common');
  const { types, isLoading } = useTypes({ limit: TYPES_PER_PAGE } as any);

  const list = (types ?? []).map((ty: any) => {
    const meta = getVerticalMeta(ty.slug, ty.name);
    return {
      slug: ty.slug,
      name: ty.name ?? meta.label,
      img: meta.scenes[0],
      href: meta.shopPath ?? meta.path,
      comingSoon: Boolean(meta.comingSoon),
    };
  });

  return (
    <section className="mb-7">
      <div className="mb-3.5 flex items-end justify-between px-5">
        <h2 className="m-0 font-pahserif text-[20px] font-semibold tracking-[-0.005em] text-forest-900">
          {t('home-verticals-title')}
        </h2>
        <Link href="/categories" className="font-hanken text-[12.5px] font-semibold text-forest-700">
          {t('home-verticals-view-all')}
        </Link>
      </div>
      <div className="pah-scroll flex gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading && list.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[96px] w-[150px] shrink-0 animate-pulse rounded-xl bg-sage-100" />
            ))
          : list.map((v) => (
              <Link
                key={v.slug}
                href={v.href}
                className="relative block h-[96px] w-[150px] shrink-0 overflow-hidden rounded-xl border border-kraft-200 bg-forest-900 shadow-[0_2px_8px_rgba(34,48,26,0.07)] active:scale-[0.97]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.img}
                  alt={v.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,16,8,0.85)_0%,rgba(5,16,8,0.25)_55%,rgba(5,16,8,0.05)_100%)]" />
                {v.comingSoon && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#D4A44B] px-2 py-0.5 font-hanken text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#231A05]">
                    {t('text-coming-soon')}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 p-2.5 font-hanken text-[13px] font-bold leading-tight text-white">
                  {v.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}

export default VerticalsRail;
