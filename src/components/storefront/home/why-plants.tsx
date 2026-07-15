'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import SafeImage from '@/components/ui/safe-image';
import { useHomeConfig } from '@/lib/use-home-config';
import { EXPO } from '@/components/storefront/motion';

/** Icon presets selectable from the admin Why-Plants editor (iconKey).
 *  Font Awesome solids (loaded in _document) — premium filled look; the admin
 *  keys are unchanged so saved CMS cards keep working. */
export const WHY_ICONS: Record<string, React.ReactNode> = {
  air: <i className="fa-solid fa-wind text-[20px]" aria-hidden />,
  stress: <i className="fa-solid fa-heart text-[20px]" aria-hidden />,
  productivity: <i className="fa-solid fa-arrow-trend-up text-[19px]" aria-hidden />,
  humidity: <i className="fa-solid fa-droplet text-[20px]" aria-hidden />,
  noise: <i className="fa-solid fa-volume-xmark text-[19px]" aria-hidden />,
  planet: <i className="fa-solid fa-earth-asia text-[20px]" aria-hidden />,
  leaf: <i className="fa-solid fa-leaf text-[20px]" aria-hidden />,
  heart: <i className="fa-solid fa-heart text-[20px]" aria-hidden />,
};

const BENEFITS: { title: string; body: string; img: string; iconKey: string }[] = [
  {
    title: 'Purify the Air',
    body: 'Plants naturally filter toxins and increase oxygen levels for cleaner, fresher air.',
    img: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&q=78&auto=format&fit=crop',
    iconKey: 'air',
  },
  {
    title: 'Reduce Stress',
    body: 'Being around plants lowers stress, boosts mood, and promotes mental well-being.',
    img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=78&auto=format&fit=crop',
    iconKey: 'stress',
  },
  {
    title: 'Boost Productivity',
    body: 'Plants improve focus and concentration, making homes and workplaces more productive.',
    img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=78&auto=format&fit=crop',
    iconKey: 'productivity',
  },
  {
    title: 'Increase Humidity',
    body: 'Plants release moisture into the air, helping maintain natural humidity and comfort.',
    img: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=78&auto=format&fit=crop',
    iconKey: 'humidity',
  },
  {
    title: 'Reduce Noise',
    body: 'Plants act as natural sound barriers, reducing noise pollution and creating calm.',
    img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=78&auto=format&fit=crop',
    iconKey: 'noise',
  },
  {
    title: 'Support the Planet',
    body: 'More plants mean a greener Earth — they absorb CO₂ and help combat climate change.',
    img: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=800&q=78&auto=format&fit=crop',
    iconKey: 'planet',
  },
];

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function WhyPlants() {
  const { t } = useTranslation('common');
  const { whyPlants } = useHomeConfig();

  // Admin-configured cards override the built-in six; fields fall back
  // per-card so half-filled admin entries never render broken.
  const cards = (whyPlants?.cards?.length ? whyPlants.cards : BENEFITS).map(
    (c: any, i: number) => ({
      title: c.title || BENEFITS[i % BENEFITS.length].title,
      body: c.body || BENEFITS[i % BENEFITS.length].body,
      img:
        (typeof c.image === 'string' ? c.image : c.image?.original) ||
        c.img ||
        BENEFITS[i % BENEFITS.length].img,
      icon:
        WHY_ICONS[c.iconKey as string] ??
        WHY_ICONS[BENEFITS[i % BENEFITS.length].iconKey],
    }),
  );
  const heading = whyPlants?.heading || t('home-why-title');
  const subtitle = whyPlants?.subtitle;

  return (
    <section className="border-t border-kraft-200/60 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-11 sm:px-8 lg:px-16 lg:pb-[48px] lg:pt-[52px]">

        {/* header */}
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EXPO }}
          className="mx-auto mb-8 max-w-[760px] text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-forest-600/15 bg-forest-600/[0.07] px-4 py-1.5 font-jost text-[11.5px] font-semibold uppercase tracking-[0.22em] text-forest-600">
            <i className="fa-solid fa-seedling text-[13px] text-forest-500" aria-hidden />
            {t('home-why-eyebrow')}
          </span>
          <h2 className="font-pahserif mt-4 text-[30px] font-bold not-italic leading-[1.05] tracking-[-0.012em] text-forest-900 sm:text-[42px]">
            {heading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-hanken text-[14px] leading-[1.55] text-stone-500 sm:text-[15.5px]">
            {subtitle ?? (
              <>
                {t('home-why-subtitle')}{' '}
                <strong className="font-bold text-forest-700">{t('home-why-subtitle-strong')}</strong>
              </>
            )}
          </p>
        </motion.div>

        {/* benefit cards — small, clean, single scrollable row */}
        <div className="pah-rail [--rail-w:52%] lg:[--rail-w:calc((100%_-_72px)/4)] grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
          {cards.map((b, i) => (
            <motion.div
              key={`${b.title}-${i}`}
              initial={{ y: 24 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: EXPO }}
              className="group relative overflow-hidden rounded-[18px] border border-kraft-200 bg-white shadow-[0_2px_8px_rgba(34,48,26,0.07)] transition-all duration-300 hover:-translate-y-[6px] hover:border-forest-200 hover:shadow-[0_16px_36px_rgba(34,48,26,0.13)]"
            >
              {/* image */}
              <div className="relative h-[150px] overflow-hidden bg-cream-100 sm:h-[160px] lg:h-[170px]">
                <SafeImage
                  src={b.img}
                  alt={b.title}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                />
                {/* subtle green tint on hover */}
                <div className="absolute inset-0 bg-forest-600/0 transition-colors duration-500 group-hover:bg-forest-600/12" />
              </div>

              {/* icon badge */}
              <div className="absolute left-1/2 top-[150px] flex h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-sage-200 bg-white text-forest-700 shadow-[0_6px_16px_rgba(20,40,24,0.12)] transition-all duration-300 group-hover:scale-110 group-hover:border-forest-300 group-hover:text-forest-600 group-hover:shadow-[0_8px_22px_rgba(20,80,24,0.2)] sm:top-[160px] lg:top-[170px]">
                {b.icon}
              </div>

              <div className="px-5 pb-6 pt-9 text-center">
                <h3 className="font-hanken text-[16px] font-bold leading-[1.2] text-forest-900 transition-colors duration-300 group-hover:text-forest-700">
                  {b.title}
                </h3>
                {/* animated divider — grows + turns green on hover */}
                <div className="mx-auto mb-3 mt-2.5 h-0.5 w-[24px] rounded-full bg-forest-400 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-[44px] group-hover:bg-[#4ADE80]" />
                <p className="mx-auto max-w-[300px] font-hanken text-[12.5px] leading-[1.6] text-stone-500">{b.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── CTA band — next level ── */}
        <motion.div
          initial={{ y: 36 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EXPO }}
          className="relative mt-10 overflow-hidden rounded-[24px]"
        >
          {/* background photo */}
          <img
            src="https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1600&q=82&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* dark overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(5,16,8,0.96)_0%,rgba(10,28,14,0.90)_45%,rgba(18,46,22,0.78)_100%)]" />
          {/* grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-overlay"
            style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
          />
          {/* green radial glow left */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(ellipse_at_0%_60%,rgba(74,222,128,0.10)_0%,transparent_65%)]" />
          {/* gold glow right */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#C8F09A]/8 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center gap-6 px-7 py-9 text-center sm:px-10 md:flex-row md:gap-7 md:py-8 md:text-left lg:gap-10 lg:px-12 lg:py-10">

            {/* icon — premium solid */}
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-2xl border border-[#4ADE80]/25 bg-[#4ADE80]/12 text-[#4ADE80] md:h-[46px] md:w-[46px] lg:h-[60px] lg:w-[60px]">
              <i className="fa-solid fa-leaf text-[26px] md:text-[20px] lg:text-[26px]" aria-hidden />
            </div>

            {/* vertical divider */}
            <div className="hidden w-px self-stretch bg-white/10 md:block" />

            {/* text */}
            <p className="flex-1 font-hanken text-[18px] font-medium leading-[1.55] text-white/90 md:text-[16px] lg:text-[21px]">
              {t('home-why-cta-band-text')}{' '}
              <strong className="font-bold text-[#86EFAC]">{t('home-why-cta-band-strong-1')}</strong>
              {' '}{t('home-why-cta-band-and')}{' '}
              <strong className="font-bold text-[#86EFAC]">{t('home-why-cta-band-strong-2')}</strong>
            </p>

            {/* CTA */}
            <Link
              href="/plants/search"
              className="shrink-0 inline-flex items-center gap-2 rounded-[13px] bg-ds-cta px-6 py-3.5 font-hanken text-[14px] font-bold text-ds-cta-ink shadow-[0_0_28px_rgba(74,222,128,0.25)] transition duration-200 hover:bg-ds-cta-hover active:scale-[0.97]"
            >
              {t('home-why-cta')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default WhyPlants;
