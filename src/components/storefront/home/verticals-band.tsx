'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import { getVerticalMeta } from '@/components/storefront/verticals';
import { useBannerEnabled } from '@/lib/use-home-config';

const EXPO = [0.22, 1, 0.36, 1] as const;

/**
 * "All our worlds" — every vertical (type) as an editorial tile on the home.
 * Data-driven from the API types (city-aware: a vertical disabled by the ops
 * control centre disappears here too); visuals/taglines come from the bespoke
 * per-slug config in storefront/verticals.ts. Verticals whose catalogue lives
 * elsewhere link via meta.shopPath; empty ones carry a "coming soon" chip.
 */
export function VerticalsBand() {
  const { t } = useTranslation('common');
  const enabled = useBannerEnabled('verticals');
  // Same options as the SSR prefetch → dehydrated cache hit, no skeleton flash.
  const { types, isLoading } = useTypes({ limit: TYPES_PER_PAGE } as any);
  if (!enabled) return null;

  const list = (types ?? []).map((ty: any) => {
    const meta = getVerticalMeta(ty.slug, ty.name);
    return {
      slug: ty.slug,
      name: ty.name ?? meta.label,
      tagline: meta.tagline,
      img: meta.scenes[0],
      href: meta.shopPath ?? meta.path,
      comingSoon: Boolean(meta.comingSoon),
    };
  });

  return (
    <section className="border-t border-kraft-200/60 bg-white">
      <div className="mx-auto max-w-7xl px-5 pb-[44px] pt-[40px] sm:px-8 lg:px-16 lg:pb-[56px] lg:pt-[48px]">
        {/* header */}
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EXPO }}
          className="mb-[26px] flex items-end justify-between gap-4"
        >
          <div>
            <div className="mb-[9px] font-jost text-[11px] font-medium uppercase tracking-[0.2em] text-forest-600">
              {t('home-verticals-eyebrow')}
            </div>
            <h2 className="m-0 font-pahserif text-[26px] font-semibold leading-[1.05] tracking-[-0.005em] text-forest-900 sm:text-[34px]">
              {t('home-verticals-title')}
            </h2>
            <p className="mt-2 max-w-xl font-hanken text-[13.5px] leading-[1.55] text-stone-500 sm:text-[14.5px] md:max-w-none md:whitespace-nowrap md:text-[12px] lg:max-w-xl lg:whitespace-normal lg:text-[14.5px]">
              {t('home-verticals-sub')}
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex shrink-0 items-center gap-[6px] whitespace-nowrap text-[14px] font-semibold text-forest-700"
          >
            {t('home-verticals-view-all')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </Link>
        </motion.div>

        {/* tiles — swipeable rail on mobile, 3×2 grid from lg so ALL worlds show */}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:pb-0">
          {(isLoading && list.length === 0
            ? Array.from({ length: 6 }).map((_, i) => ({ skeleton: true, slug: `s${i}` }) as any)
            : list
          ).map((v: any, i: number) =>
            v.skeleton ? (
              <div
                key={v.slug}
                className="h-[210px] w-[72%] shrink-0 animate-pulse rounded-[18px] bg-sage-100 sm:w-[44%] md:h-[172px] md:w-[36%] lg:h-[230px] lg:w-auto"
              />
            ) : (
              <motion.div
                key={v.slug}
                initial={{ y: 24 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: EXPO }}
                className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[36%] lg:w-auto"
              >
                <Link
                  href={v.href}
                  className="group relative block h-[210px] overflow-hidden rounded-[18px] border border-kraft-200 bg-forest-900 shadow-[0_2px_10px_rgba(34,48,26,0.08)] transition-all duration-300 hover:-translate-y-[4px] hover:shadow-[0_16px_36px_rgba(34,48,26,0.16)] md:h-[172px] lg:h-[230px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.img}
                    alt={v.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,16,8,0.88)_0%,rgba(5,16,8,0.35)_45%,rgba(5,16,8,0.08)_100%)]" />

                  {v.comingSoon && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#D4A44B] px-3 py-1 font-hanken text-[10px] font-bold uppercase tracking-[0.14em] text-[#231A05]">
                      {t('text-coming-soon')}
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 md:p-4 lg:p-5">
                    <div className="min-w-0">
                      <h3 className="m-0 font-pahserif text-[23px] font-semibold leading-none text-white md:text-[19px] lg:text-[23px]">
                        {v.name}
                      </h3>
                      <p className="mt-1.5 line-clamp-1 font-hanken text-[12.5px] text-white/75">
                        {v.tagline}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-[#4ADE80] group-hover:text-forest-950">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12h13M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export default VerticalsBand;
