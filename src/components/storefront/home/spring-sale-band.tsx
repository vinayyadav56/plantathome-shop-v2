'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { useBannerEnabled } from '@/lib/use-home-config';
import { EXPO } from '@/components/storefront/motion';

const PERKS = [
  {
    label: 'Best Quality Products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
      </svg>
    ),
  },
  {
    label: 'Expert Plant Care Support',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
  {
    label: 'Easy Returns & Refunds',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
  },
  {
    label: 'Secure Payments',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export function SpringSaleBand() {
  const { t } = useTranslation('common');
  if (!useBannerEnabled('specialOffer')) return null;

  return (
    <motion.section
      initial={{ y: 32 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: EXPO }}
      className="py-6 lg:py-8"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-16">
      <div className="relative overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#1c4d28_0%,#0f2d1a_48%,#081a0f_100%)]">

        {/* grain texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />

        {/* soft radial glow on left */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[380px] bg-[radial-gradient(ellipse_at_10%_50%,rgba(74,222,128,0.13)_0%,transparent_65%)]" />

        <div className="relative z-10 flex flex-col gap-4 px-5 py-5 sm:px-8 md:flex-row md:items-center md:gap-0 lg:px-10 lg:py-6">

          {/* ── LEFT — offer block ── */}
          <div className="shrink-0 md:w-[210px] lg:w-[260px]">
            {/* pulsing badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#4ADE80]/25 bg-[#4ADE80]/10 px-3 py-1">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-70" />
                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#4ADE80]" />
              </span>
              <span className="font-hanken text-[10px] font-bold uppercase tracking-[0.16em] text-[#86EFAC]">
                {t('home-sale-eyebrow')}
              </span>
            </div>

            {/* discount */}
            <div className="font-pahserif text-[34px] font-bold leading-none tracking-[-0.01em] text-[#F2E3B8]">
              {t('home-sale-discount')}
            </div>
            <div className="mt-1 font-hanken text-[11px] leading-snug text-white/80">
              {t('home-sale-condition')}
            </div>

            {/* CTA */}
            <Link
              href="/plants/search"
              className="mt-3 inline-flex items-center gap-1.5 rounded-[9px] bg-ds-cta px-4 py-2 font-hanken text-[12.5px] font-bold text-ds-cta-ink transition duration-200 hover:bg-ds-cta-hover active:scale-[0.97]"
            >
              {t('home-sale-cta')}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          {/* vertical divider */}
          <div className="hidden w-px self-stretch bg-white/[0.1] md:mx-6 md:block lg:mx-10" />
          {/* horizontal divider on mobile */}
          <div className="h-px w-full bg-white/[0.08] md:hidden" />

          {/* ── RIGHT — perks ── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:flex md:flex-1 md:items-center md:justify-between">
            {PERKS.map((p, i) => (
              <React.Fragment key={p.label}>
                {i > 0 && <span aria-hidden className="hidden h-8 w-px shrink-0 bg-white/15 md:block" />}
                <motion.div
                  initial={{ y: 14 }}
                  whileInView={{ y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.45, ease: EXPO }}
                  className="flex items-center gap-3"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 text-[#4ADE80] md:h-9 md:w-9 lg:h-11 lg:w-11 [&>svg]:h-[18px] [&>svg]:w-[18px] md:[&>svg]:h-[15px] md:[&>svg]:w-[15px] lg:[&>svg]:h-[18px] lg:[&>svg]:w-[18px]">
                    {p.icon}
                  </span>
                  <div className="max-w-[120px] font-hanken text-[12.5px] font-semibold leading-[1.35] text-white md:max-w-[96px] md:text-[11px] lg:max-w-[120px] lg:text-[12.5px]">
                    {p.label}
                  </div>
                </motion.div>
              </React.Fragment>
            ))}
          </div>

        </div>
      </div>
      </div>
    </motion.section>
  );
}

export default SpringSaleBand;
