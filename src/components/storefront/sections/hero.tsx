import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Icon } from '../icons';
import { Magnetic, WordReveal, KenBurns, EXPO } from '../motion';
import { VideoModal } from './video-modal';
import { useSettings } from '@/framework/settings';

export function Hero({
  scenes,
  eyebrow,
  titleA,
  titleB,
  sub,
  primary = 'Shop the collection',
  primaryTo = '#categories',
  tourTitle = 'Step inside a PlantAtHome home',
  tourSubtitle = 'A calm, plant-filled space — see how living with greenery looks and feels.',
}: {
  scenes: string[];
  eyebrow: string;
  titleA: string;
  titleB: string;
  sub: string;
  primary?: string;
  primaryTo?: string;
  tourTitle?: string;
  tourSubtitle?: string;
}) {
  const { settings } = useSettings();
  // admin → Storefront Media can override the hero background with one image
  const heroImage = (settings as any)?.sectionMedia?.heroImage;
  const heroScenes = heroImage ? [heroImage] : scenes;

  const [tour, setTour] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const cardA = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const cardB = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={ref} className="relative h-[72svh] min-h-[520px] w-full overflow-hidden lg:h-[78svh]">
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
        <KenBurns images={heroScenes} interval={6} />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-deep/85 via-deep/25 to-deep/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-deep/80 via-deep/35 to-deep/10" />

      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-8"
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: EXPO }}
          className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-md"
        >
          <Icon.spark className="h-3.5 w-3.5 text-goldlight" /> {eyebrow}
        </motion.span>

        <h1 className="max-w-4xl font-serif text-[2.8rem] font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-[5.75rem]">
          <WordReveal text={titleA} delay={0.15} />
          <span className="block text-goldlight">
            <WordReveal text={titleB} delay={0.45} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7, ease: EXPO }}
          className="mt-6 max-w-xl text-[14px] leading-7 text-white/90 sm:text-lg"
        >
          {sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.7, ease: EXPO }}
          className="mt-9 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
        >
          <Link href={primaryTo} scroll={false} className="w-full sm:w-auto">
            <Magnetic className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-goldlight px-7 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-forest-900 shadow-[0_18px_50px_rgba(181,142,57,0.35)] sm:w-auto">
              {primary} <Icon.arrow className="h-4 w-4" />
            </Magnetic>
          </Link>
          <Magnetic
            onClick={() => setTour(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/35 bg-white/10 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md sm:w-auto"
          >
            <Icon.play className="h-3.5 w-3.5" /> Watch the tour
          </Magnetic>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-10 flex flex-wrap gap-2.5"
        >
          {['Same-day delivery', '30-day guarantee', 'Hand-picked'].map((t) => (
            <span
              key={t}
              className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-medium text-white/90 backdrop-blur-md"
            >
              {t}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: cardA, opacity: fade }}
        className="absolute right-8 top-[27%] z-10 hidden w-52 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl lg:block"
      >
        <div className="font-heading text-3xl font-black text-white">12k+</div>
        <div className="mt-1 text-xs text-white/80">happy customers across India</div>
      </motion.div>
      <motion.div
        style={{ y: cardB, opacity: fade }}
        className="absolute bottom-[15%] right-[15%] z-10 hidden items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl lg:flex"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold text-white">
          <Icon.star className="h-5 w-5" />
        </span>
        <div>
          <div className="font-heading text-lg font-extrabold text-white">4.9 / 5</div>
          <div className="text-[11px] text-white/75">12,000+ reviews</div>
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-white/80"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[11px] uppercase tracking-[0.3em]">Scroll</span>
          <span className="h-9 w-[1.5px] bg-gradient-to-b from-white/80 to-transparent" />
        </motion.div>
      </motion.div>

      <VideoModal
        open={tour}
        onClose={() => setTour(false)}
        scenes={scenes}
        title={tourTitle}
        subtitle={tourSubtitle}
      />
    </section>
  );
}
