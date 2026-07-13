import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { WordReveal, Magnetic } from '../motion';
import { useSettings } from '@/framework/settings';

// Defaults (used when admin → Storefront Media hasn't set a custom clip).
const DEFAULT_RITUAL_VIDEO =
  'https://videos.pexels.com/video-files/7048904/7048904-hd_1920_1080_30fps.mp4';
const DEFAULT_RITUAL_VIDEO_ALT =
  'https://videos.pexels.com/video-files/853915/853915-hd_1920_1080_25fps.mp4';
const DEFAULT_RITUAL_POSTER = '/images/sections/ritual-bg.jpg';

export function RitualVideo() {
  const { settings } = useSettings();
  const sm = (settings as any)?.sectionMedia ?? {};
  const RITUAL_VIDEO = sm.ritualVideo || DEFAULT_RITUAL_VIDEO;
  const RITUAL_VIDEO_ALT = sm.ritualVideoAlt || DEFAULT_RITUAL_VIDEO_ALT;
  const RITUAL_POSTER = sm.ritualPoster || DEFAULT_RITUAL_POSTER;

  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  return (
    <section
      ref={ref}
      className="relative mx-auto my-6 max-w-[88rem] overflow-hidden rounded-[1.5rem] px-5 sm:mx-8 sm:my-10 sm:rounded-[2.5rem]"
    >
      {/* video */}
      <motion.div style={{ y }} className="absolute inset-[-8%]">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={RITUAL_POSTER}
        >
          <source src={RITUAL_VIDEO} type="video/mp4" />
          <source src={RITUAL_VIDEO_ALT} type="video/mp4" />
        </video>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={RITUAL_POSTER}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      </motion.div>

      {/* greenish overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-forest/45 to-leaf/20" />
      <div className="absolute inset-0 bg-forest/25" />

      {/* content */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center py-20 text-center sm:py-28 lg:py-32">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-goldlight">
          The PlantAtHome ritual
        </p>
        <h2 className="font-serif text-5xl font-semibold leading-[1] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] sm:text-6xl lg:text-7xl">
          <WordReveal text="More than a store. A botanical ritual." />
        </h2>
        <p className="mt-5 max-w-md text-base leading-7 text-white/90">
          Start your green journey with a curated box, expert onboarding, and a
          community of 12,000+ plant parents.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="#products" scroll={false}>
            <Magnetic className="rounded-full bg-leaf px-7 py-4 text-sm font-bold text-white shadow-[0_14px_40px_rgba(67,160,71,0.45)]">
              Start shopping
            </Magnetic>
          </Link>
          <Link href="/contact">
            <Magnetic className="rounded-full border border-white/35 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md">
              Book a styling call
            </Magnetic>
          </Link>
        </div>
      </div>
    </section>
  );
}
