'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { useBannerEnabled } from '@/lib/use-home-config';
import { EXPO } from '@/components/storefront/motion';
import { ArrowRight } from '@/components/ui/icon';

export function SpringSaleBand() {
  const { t } = useTranslation('common');
  const enabled = useBannerEnabled('specialOffer');
  if (!enabled) return null;

  return (
    <motion.section
      initial={{ y: 32 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: EXPO }}
      className="py-6 lg:py-8"
    >
      <div className="mx-auto max-w-none px-5 sm:px-8 lg:px-16">
      <div className="relative overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#1c4d28_0%,#0f2d1a_48%,#081a0f_100%)]">

        {/* grain texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />

        {/* soft radial glow behind the offer */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[380px] bg-[radial-gradient(ellipse_at_10%_50%,rgba(74,222,128,0.13)_0%,transparent_65%)]" />

        {/* One message, set well. The trust claims that used to sit on the right
            are TrustRow's job — it already makes all four, in better copy, at the
            foot of this same page. Repeating them here diluted the offer and cost
            it the width it needed to carry the section on its own. */}
        <div className="relative z-10 flex flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-10 lg:py-7">

          <div className="min-w-0 lg:flex lg:items-center lg:gap-7">
            {/* pulsing live badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#4ADE80]/25 bg-[#4ADE80]/10 px-3 py-1 lg:mb-0 lg:shrink-0">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-70" />
                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#4ADE80]" />
              </span>
              <span className="whitespace-nowrap font-hanken text-[9px] font-bold uppercase tracking-[0.14em] text-[#86EFAC] lg:text-[10px] lg:tracking-[0.16em]">
                {t('home-sale-eyebrow')}
              </span>
            </div>

            <div className="min-w-0">
              {/* The gold figure is the only saturated colour left in the strip,
                  so it reads as the focal point without competing for it. */}
              <div className="font-pahserif text-[30px] font-bold leading-none tracking-[-0.01em] text-[#F2E3B8] sm:text-[36px] lg:text-[42px]">
                {t('home-sale-discount')}
              </div>
              <div className="mt-1.5 font-hanken text-[12.5px] leading-snug text-white/80 lg:text-[14px]">
                {t('home-sale-condition')}
              </div>
            </div>
          </div>

          <Link
            href="/plants/search"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-[10px] bg-ds-cta px-5 py-2.5 font-hanken text-[13px] font-bold text-ds-cta-ink transition duration-200 hover:bg-ds-cta-hover active:scale-[0.97] lg:self-auto lg:px-6 lg:py-3 lg:text-[14px]"
          >
            {t('home-sale-cta')}
            <ArrowRight size={14} aria-hidden />
          </Link>

        </div>
      </div>
      </div>
    </motion.section>
  );
}

export default SpringSaleBand;
