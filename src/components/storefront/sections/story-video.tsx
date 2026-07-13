import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { WordReveal, Magnetic } from '../motion';
import { Icon } from '../icons';
import { useSettings } from '@/framework/settings';

// Defaults (used when admin → Storefront Media hasn't set a custom clip).
const DEFAULT_STORY_VIDEO =
  'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4';
const DEFAULT_STORY_VIDEO_ALT =
  'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4';
const DEFAULT_STORY_POSTER = '/story-ocean-poster.png';

/** Pinned full-screen video story block: content reveals over the clip on scroll. */
export function StoryVideo() {
  const { settings } = useSettings();
  const sm = (settings as any)?.sectionMedia ?? {};
  const STORY_VIDEO = sm.storyVideo || DEFAULT_STORY_VIDEO;
  const STORY_VIDEO_ALT = sm.storyVideoAlt || DEFAULT_STORY_VIDEO_ALT;
  const STORY_POSTER = sm.storyPoster || DEFAULT_STORY_POSTER;

  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [-60, 60]);
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const op = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <section id="story" ref={ref} className="relative h-[180vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* video bg + parallax */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-[-10%]">
            <video
              className="h-full w-full object-cover contrast-[1.04] saturate-[1.06]"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={STORY_POSTER}
            >
              <source src={STORY_VIDEO} type="video/mp4" />
              <source src={STORY_VIDEO_ALT} type="video/mp4" />
            </video>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STORY_POSTER}
              alt=""
              aria-hidden
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-deep/45 via-deep/10 to-deep/55" />
          {/* soft scrim behind the centered text so the water stays crisp but copy is legible */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,24,16,0.4)_0%,transparent_62%)]" />
        </div>

        {/* content */}
        <motion.div
          style={{ y: textY, opacity: op }}
          className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 text-center [text-shadow:0_2px_24px_rgba(8,20,12,0.55)]"
        >
          <span className="mb-5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md">
            Our story
          </span>
          <h2 className="font-serif text-6xl font-semibold leading-[1] text-white sm:text-7xl lg:text-8xl">
            <WordReveal text="From wild greenhouses to your living room." />
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
            Every plant is nurtured in living water-gardens, acclimatised for
            Indian homes, and delivered at its absolute peak — roots happy,
            leaves glossy, ready to thrive.
          </p>
          <Link href="#products" scroll={false}>
            <Magnetic className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-forest">
              Discover the craft <Icon.arrow className="h-4 w-4" />
            </Magnetic>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
