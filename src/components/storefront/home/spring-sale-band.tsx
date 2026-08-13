'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { useBannerEnabled } from '@/lib/use-home-config';
import { EXPO } from '@/components/storefront/motion';
import { ArrowRight, Headset, RotateCcw, ShieldCheck, Sprout } from '@/components/ui/icon';

// Two words each: the labels have to survive a quarter of the rail at 1280px
// without wrapping, and every claim here is one the storefront already makes.
const PERKS = [
  // Sized by the parent's [&>svg] rules (responsive), so no `size` prop here.
  { label: 'Nursery fresh', icon: <Sprout aria-hidden /> },
  { label: 'Care experts', icon: <Headset aria-hidden /> },
  { label: 'Easy returns', icon: <RotateCcw aria-hidden /> },
  { label: 'Secure payments', icon: <ShieldCheck aria-hidden /> },
];

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

        {/* soft radial glow on left */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[380px] bg-[radial-gradient(ellipse_at_10%_50%,rgba(74,222,128,0.13)_0%,transparent_65%)]" />

        {/* Below md the offer stacks ON TOP of the perks: side-by-side at 640px
            leaves the perk grid ~120px per column, which is what forced the
            labels onto two lines. */}
        <div className="relative z-10 flex flex-col gap-5 px-5 py-5 sm:px-8 md:flex-row md:items-center md:gap-0 lg:px-10 lg:py-6">

          {/* ── LEFT — the offer. It keeps the only saturated colour in the
                strip (gold figure, green badge, CTA) so it stays the single
                focal point and the perks read as a quiet footnote to it. ── */}
          <div className="md:w-[188px] md:shrink-0 lg:w-[220px]">
            {/* pulsing badge */}
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#4ADE80]/25 bg-[#4ADE80]/10 px-3 py-1 lg:mb-3">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-70" />
                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#4ADE80]" />
              </span>
              <span className="whitespace-nowrap font-hanken text-[9px] font-bold uppercase tracking-[0.14em] text-[#86EFAC] lg:text-[10px] lg:tracking-[0.16em]">
                {t('home-sale-eyebrow')}
              </span>
            </div>

            {/* discount */}
            <div className="whitespace-nowrap font-pahserif text-[27px] font-bold leading-none tracking-[-0.01em] text-[#F2E3B8] lg:text-[34px]">
              {t('home-sale-discount')}
            </div>
            <div className="mt-1 whitespace-nowrap font-hanken text-[10.5px] leading-snug text-white/80 lg:text-[11px]">
              {t('home-sale-condition')}
            </div>

            {/* CTA */}
            <Link
              href="/plants/search"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-[9px] bg-ds-cta px-3.5 py-1.5 font-hanken text-[11.5px] font-bold text-ds-cta-ink transition duration-200 hover:bg-ds-cta-hover active:scale-[0.97] lg:mt-3 lg:px-4 lg:py-2 lg:text-[12.5px]"
            >
              {t('home-sale-cta')}
              <ArrowRight size={12} aria-hidden />
            </Link>
          </div>

          {/* Separator between the two messages: a rule under the offer while
              stacked, a full-height hairline once they sit side by side. */}
          <div className="h-px w-full bg-white/10 md:mx-6 md:h-auto md:w-px md:self-stretch lg:mx-8" />

          {/* ── RIGHT — trust rail. Equal grid tracks rather than
                justify-between: the four items then keep the same rhythm at
                every width, and the hairline can ride the column edge instead
                of being injected as a flex child that only exists from lg. ── */}
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-5 xl:grid-cols-4">
            {PERKS.map((p) => (
              <div
                key={p.label}
                className="flex min-w-0 items-center gap-2.5 border-white/10 even:border-l even:ps-4 sm:gap-3 xl:border-l xl:ps-4 xl:first:border-l-0 xl:first:ps-0"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 text-white/70 lg:h-10 lg:w-10 [&>svg]:h-[13px] [&>svg]:w-[13px] lg:[&>svg]:h-4 lg:[&>svg]:w-4">
                  {p.icon}
                </span>
                <span className="truncate font-hanken text-[11px] font-semibold leading-[1.35] text-white/90 lg:text-[12.5px]">
                  {p.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
      </div>
    </motion.section>
  );
}

export default SpringSaleBand;
