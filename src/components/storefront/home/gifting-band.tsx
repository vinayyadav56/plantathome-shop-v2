'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import SafeImage from '@/components/ui/safe-image';
import { useBannerEnabled } from '@/lib/use-home-config';
import { EXPO } from '@/components/storefront/motion';

const REASONS: { a: string; b: string; icon: React.ReactNode }[] = [
  { a: 'Better for People', b: '& Workspaces', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.85-5.4 5.08-6" /></svg>) },
  { a: 'Elegant Gifts for', b: 'Every Occasion', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" /></svg>) },
  { a: 'Sustainable Choice', b: 'for a Greener Future', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5a15 15 0 0 1 4 9.5 15 15 0 0 1-4 9.5 15 15 0 0 1-4-9.5 15 15 0 0 1 4-9.5Z" /></svg>) },
  { a: 'Perfect for Clients,', b: 'Partners & Employees', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M9 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" /><path d="M9 21H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h5" /><path d="M13 8h3M13 12h3M13 16h3" /></svg>) },
];

const ASSURE: { title: string; sub: string; icon: React.ReactNode }[] = [
  {
    title: 'Curated with Care',
    sub: 'Premium quality plants, beautifully packaged.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M12 21s7-3.6 7-9V5.6L12 3 5 5.6V12c0 5.4 7 9 7 9Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Customized for You',
    sub: 'Personalized messages, branding & bulk options.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <circle cx="12" cy="8.5" r="5.5" />
        <path d="m12 5.8 1 2 2.2.3-1.6 1.5.4 2.2L12 12.8l-2 1.1.4-2.3L8.8 9.6l2.2-.3Z" />
        <path d="M8.6 13.6 7 22l5-2.8L17 22l-1.6-8.4" />
      </svg>
    ),
  },
  {
    title: 'Pan India Delivery',
    sub: 'Timely and safe delivery across 500+ cities.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M2 17V6.5A1.5 1.5 0 0 1 3.5 5h10A1.5 1.5 0 0 1 15 6.5V17" />
        <path d="M15 9h3.6a2 2 0 0 1 1.7 1l1.7 3v4h-3" />
        <circle cx="6.5" cy="17.5" r="2" />
        <circle cx="17.5" cy="17.5" r="2" />
      </svg>
    ),
  },
];

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function GiftingBand() {
  const { t } = useTranslation('common');
  if (!useBannerEnabled('gifting')) return null;

  return (
    <section className="bg-[#F8F7F2]">
      {/* top — copy + photo (constrained width so it doesn't run edge-to-edge) */}
      <div className="mx-auto flex max-w-7xl flex-col lg:min-h-[460px] lg:flex-row lg:items-stretch">

        {/* left copy */}
        <motion.div
          initial={{ x: -28 }}
          whileInView={{ x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EXPO }}
          className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:flex-[1_1_56%] lg:py-[34px] lg:pe-[30px] lg:ps-16"
        >
          <span className="font-jost inline-flex w-fit items-center gap-2.5 rounded-full border-[1.5px] border-sage-400 bg-white/45 px-[18px] py-[9px] text-[11px] font-medium uppercase tracking-[0.22em] text-forest-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-forest-600"><path d="M7 20s-1-7 4-11c0 0 2 4-1 7" /><path d="M12 20c0-6 4-10 9-10 0 6-4 10-9 10Z" /></svg>
            {t('home-gift-eyebrow')}
          </span>
          <h2 className="font-cormorant mt-4 text-[2.4rem] font-semibold leading-[1.0] tracking-[-0.02em] text-forest-900 sm:text-[56px]">
            {t('home-gift-title-1')}<br />{t('home-gift-title-2')} <span className="text-forest-600">{t('home-gift-title-3')}</span>
          </h2>
          <div className="mt-4 flex max-w-[472px] items-center gap-[13px]">
            <div className="h-px w-[120px] shrink-0 bg-kraft-300 sm:w-[186px]" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[15px] w-[15px] text-forest-500"><path d="M7 20s-1-7 4-11c0 0 2 4-1 7" /><path d="M12 20c0-6 4-10 9-10 0 6-4 10-9 10Z" /></svg>
            <div className="h-px flex-1 bg-kraft-300" />
          </div>
          <p className="mt-3.5 max-w-[468px] text-[16px] leading-[1.58] tracking-[0.002em] text-[#33422F] sm:text-[19px]">
            {t('home-gift-subtitle')}
          </p>
          {/* equal-width columns so all four reasons sit in symmetry */}
          <div className="mt-6 grid max-w-[820px] grid-cols-2 gap-y-7 sm:grid-cols-4 sm:items-stretch">
            {REASONS.map((r, i) => (
              <div key={r.a} className="relative flex flex-col items-center px-2 text-center sm:px-3.5">
                {i > 0 && <div className="absolute left-0 top-1/2 hidden h-16 w-px -translate-y-1/2 bg-kraft-300 sm:block" />}
                <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-sage-100 text-forest-700 sm:h-[62px] sm:w-[62px]">{r.icon}</div>
                <div className="mt-3.5 text-[12px] font-semibold leading-[1.45] tracking-[0.01em] text-forest-900 sm:text-[12.5px]">{r.a}<br />{r.b}</div>
              </div>
            ))}
          </div>
          <Link href="/corporate-gifting" className="font-jost mt-6 inline-flex w-fit items-center gap-3 rounded-[11px] bg-ds-btn px-[30px] py-[17px] text-[14px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-ds-btn-hover">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" /></svg>
            {t('home-gift-cta')}
          </Link>
        </motion.div>

        {/* right photo */}
        <motion.div
          initial={{ scale: 1.04 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: EXPO }}
          className="relative h-64 min-h-[260px] w-full overflow-hidden sm:h-80 lg:h-auto lg:flex-[1_1_44%]"
        >
          <SafeImage
            src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1400&q=85&auto=format&fit=crop"
            alt="Corporate plant gifting"
            fill
            sizes="(max-width:1024px) 100vw, 44vw"
            className="object-cover"
          />
          {/* left-edge fade to blend with copy panel on desktop */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F8F7F2] to-transparent lg:block hidden" />
        </motion.div>
      </div>

      {/* ── assurance band — next level ── */}
      <div className="px-5 pb-6 pt-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ y: 28 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: EXPO }}
          className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#163320_0%,#0e2618_48%,#081508_100%)]"
        >
          {/* grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
          />
          {/* green radial glow */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[radial-gradient(ellipse_at_0%_50%,rgba(74,222,128,0.10)_0%,transparent_70%)]" />
          {/* right glow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(ellipse_at_100%_50%,rgba(74,222,128,0.07)_0%,transparent_70%)]" />

          <div className="relative z-10 flex flex-col divide-y divide-white/[0.08] sm:flex-row sm:divide-x sm:divide-y-0">
            {ASSURE.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ y: 20 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: EXPO }}
                className="group flex flex-1 items-center gap-4 px-7 py-6 transition-colors duration-300 hover:bg-white/[0.035] sm:flex-col sm:items-start sm:px-8 sm:py-7 lg:flex-row lg:items-center"
              >
                {/* icon with glow ring */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-[14px] bg-[#4ADE80]/0 blur-md transition-all duration-500 group-hover:bg-[#4ADE80]/20 group-hover:blur-lg" />
                  <div className="relative grid h-11 w-11 place-items-center rounded-[14px] border border-[#4ADE80]/20 bg-[#4ADE80]/[0.10] text-[#86EFAC] transition-all duration-300 group-hover:border-[#4ADE80]/35 group-hover:bg-[#4ADE80]/[0.16]">
                    {g.icon}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="font-hanken text-[14px] font-bold leading-snug tracking-[-0.01em] text-white">
                    {g.title}
                  </div>
                  <div className="mt-1 font-hanken text-[12px] leading-[1.5] text-white/90">
                    {g.sub}
                  </div>
                  {/* animated accent line */}
                  <div className="mt-2.5 h-[1.5px] w-4 rounded-full bg-[#4ADE80]/50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-8 group-hover:bg-[#4ADE80]" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default GiftingBand;
