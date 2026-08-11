'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import SafeImage from '@/components/ui/safe-image';
import { useHomeConfig } from '@/lib/use-home-config';
import { EXPO } from '@/components/storefront/motion';
import { ArrowRight, Droplet, Earth, Heart, Sprout, TrendingUp, VolumeX, Wind } from '@/components/ui/icon';

/** Icon presets selectable from the admin Why-Plants editor (iconKey).
 *  Lucide glyphs via the shared icon funnel (same picks as pah/why-plants).
 *  Admin keys are unchanged so saved CMS cards keep working. The rendering
 *  chip sizes these via its [&>svg] rules. */
export const WHY_ICONS: Record<string, React.ReactNode> = {
  air: <Wind size={16} aria-hidden />,
  stress: <Heart size={16} aria-hidden />,
  productivity: <TrendingUp size={16} aria-hidden />,
  humidity: <Droplet size={16} aria-hidden />,
  noise: <VolumeX size={16} aria-hidden />,
  planet: <Earth size={16} aria-hidden />,
  leaf: <Sprout size={16} aria-hidden />,
  heart: <Heart size={16} aria-hidden />,
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
      <div className="mx-auto max-w-none px-5 py-11 sm:px-8 lg:px-16 lg:pb-[48px] lg:pt-[52px]">

        {/* header */}
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EXPO }}
          className="mx-auto mb-8 max-w-[760px] text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-forest-600/15 bg-forest-600/[0.07] px-4 py-1.5 font-jost text-[11.5px] font-semibold uppercase tracking-[0.22em] text-forest-600">
            <Sprout size={14} className="text-forest-500" aria-hidden />
            {t('home-why-eyebrow')}
          </span>
          {/* One line on mobile too — fluid rather than fixed 30px, which wrapped
              "Small Plants, Big Impact" onto two lines on a 390px screen. */}
          <h2 className="font-pahserif mt-4 whitespace-nowrap text-[clamp(20px,7.2vw,30px)] font-medium not-italic leading-[1.05] tracking-[-0.012em] text-forest-900 sm:text-[42px]">
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

        {/* Benefit cards.
            The previous card carried a 50px circle badge absolutely positioned
            to straddle the image/body seam — pinned per-breakpoint to the image
            height, it drifted whenever one changed, and at md the whole card
            shrank to 10.5px body text to force four into view: unreadable, and
            the annotated "looking very worst". The icon now lives in the body
            as a chip beside the title (no absolute maths to drift), copy is
            left-aligned and never below 12.5px, and md shows 3 per view instead
            of shrinking type to fit 4. The image keeps its own rounding inset
            from the card so the two radii no longer fight. */}
        <div className="pah-rail [--rail-w:74%] sm:[--rail-w:46%] md:[--rail-w:calc((100%_-_48px)/3)] lg:[--rail-w:calc((100%_-_72px)/4)] grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
          {cards.map((b, i) => (
            <motion.div
              key={`${b.title}-${i}`}
              initial={{ y: 24 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: EXPO }}
              className="group flex flex-col overflow-hidden rounded-[18px] border border-kraft-200 bg-white p-2.5 shadow-[0_2px_8px_rgba(34,48,26,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-forest-200 hover:shadow-[0_14px_32px_rgba(34,48,26,0.12)]"
            >
              {/* image — inset with its own radius, so it reads as a framed
                  photograph instead of a bleed fighting the card's corners */}
              <div className="relative h-[150px] overflow-hidden rounded-[12px] bg-cream-100 sm:h-[160px] md:h-[130px] lg:h-[160px]">
                <SafeImage
                  src={b.img}
                  alt={b.title}
                  fill
                  sizes="(max-width:640px) 74vw, (max-width:1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                />
              </div>

              <div className="flex flex-1 flex-col px-2.5 pb-3.5 pt-4 md:px-2 md:pb-3 md:pt-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-forest-600/[0.08] text-forest-700 [&>svg]:h-[16px] [&>svg]:w-[16px]">
                    {b.icon}
                  </span>
                  <h3 className="font-hanken text-[15.5px] font-semibold leading-snug text-forest-900 md:text-[14px] lg:text-[15.5px]">
                    {b.title}
                  </h3>
                </div>
                <p className="mt-2.5 font-hanken text-[13px] leading-[1.6] text-stone-500 md:text-[12.5px]">
                  {b.body}
                </p>
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
          {/* Dark overlay. The band used to layer acid-green (#4ADE80/#86EFAC)
              accents, a green radial glow, a gold blur blob and a glowing CTA
              shadow over this — the lone-neon-pop-on-near-black look, and none
              of it the brand green. One quiet overlay + grain now; the type and
              the design-system CTA do the work. */}
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,18,10,0.95)_0%,rgba(14,30,17,0.90)_45%,rgba(24,48,28,0.80)_100%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-overlay"
            style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
          />

          <div className="relative z-10 flex flex-col items-center gap-6 px-7 py-9 text-center sm:px-10 md:flex-row md:gap-7 md:py-8 md:text-left lg:gap-10 lg:px-12 lg:py-10">

            <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-sage-200 md:h-[46px] md:w-[46px] lg:h-[56px] lg:w-[56px]">
              {/* responsive sizing → classes, no size prop */}
              <Sprout className="h-[24px] w-[24px] md:h-[20px] md:w-[20px] lg:h-[24px] lg:w-[24px]" aria-hidden />
            </div>

            {/* vertical divider */}
            <div className="hidden w-px self-stretch bg-white/10 md:block" />

            {/* text */}
            <p className="flex-1 font-hanken text-[17px] font-medium leading-[1.55] text-white/90 md:text-[15.5px] lg:text-[20px]">
              {t('home-why-cta-band-text')}{' '}
              <strong className="font-bold text-sage-200">{t('home-why-cta-band-strong-1')}</strong>
              {' '}{t('home-why-cta-band-and')}{' '}
              <strong className="font-bold text-sage-200">{t('home-why-cta-band-strong-2')}</strong>
            </p>

            {/* CTA — the design-system button, minus the green glow it used to carry */}
            <Link
              href="/plants/search"
              className="shrink-0 inline-flex items-center gap-2 rounded-[13px] bg-ds-cta px-6 py-3.5 font-hanken text-[14px] font-bold text-ds-cta-ink transition duration-200 hover:bg-ds-cta-hover active:scale-[0.97]"
            >
              {t('home-why-cta')}
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export default WhyPlants;
