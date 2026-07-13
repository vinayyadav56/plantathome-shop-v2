'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useBannerEnabled } from '@/lib/use-home-config';
import { Icon } from '../icons';
import { EXPO, WordReveal } from '../motion';
import { usePincodeServiceability } from '@/lib/use-pincode-serviceability';
import { useSettings } from '@/framework/settings';

// Luxury hero, round 6 — a cinematic HOUSE-TOUR sequence through the glass-walled
// greenhouse villa: approach the exterior → step into the living space → linger on
// the glasshouse at dusk. This villa tour is the BUILT-IN DEFAULT; admins can
// override it entirely from Settings → Hero Slides (images/videos + per-slide
// copy/CTA), and the storefront falls back to this tour whenever none are set.
const TOUR_SCENES = [
  '/hero-emerald.jpg', // open: emerald room, arched window, monstera (user's pick)
  '/hero-villa-interior.jpg', // inside: jungle living room
  '/hero-villa-exterior.jpg', // approach: glass villa in the forest
  '/hero-glasshouse-dusk.jpg', // dusk: glass walls glowing (2560px)
];

// Per-scene choreography: alternating push-in / pull-back + lateral drift, slow
// 2s crossfades — reads like a steadicam walkthrough rather than a slideshow.
const MOVES = [
  { scale: [1.18, 1.02], x: ['3%', '-2%'], y: ['1%', '-1%'] }, // dolly forward
  { scale: [1.04, 1.2], x: ['-2%', '2%'], y: ['-1%', '1%'] }, // push toward the green
  { scale: [1.16, 1.04], x: ['2%', '-2%'], y: ['1.5%', '-1%'] }, // settle on the glow
  { scale: [1.2, 1.04], x: ['-2.5%', '2%'], y: ['1%', '-1.5%'] }, // drift past the window
];
const SCENE_SECONDS = 8;

type HeroSlideView = {
  type: 'image' | 'video';
  src: string;
  poster?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  overlayOpacity?: number;
};

const str = (v: any): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

/**
 * Resolve the hero slides: admin-configured (Settings → Hero Slides) when present
 * and valid, otherwise the built-in villa-tour images. `configured` lets the
 * render path keep the default look byte-for-byte when nothing is set.
 */
export function useHeroSlides(): { slides: HeroSlideView[]; configured: boolean } {
  const { settings } = useSettings() as any;
  const raw = settings?.heroSlides;

  if (Array.isArray(raw) && raw.length) {
    const slides = raw
      .map((s: any): HeroSlideView | null => {
        const isVideo = s?.type === 'video';
        const src = isVideo ? s?.video?.original : s?.image?.original;
        if (!src || typeof src !== 'string') return null;
        return {
          type: isVideo ? 'video' : 'image',
          src,
          poster: str(s?.videoPoster?.original),
          headline: str(s?.headline),
          subheadline: str(s?.subheadline),
          ctaText: str(s?.ctaText),
          ctaLink: str(s?.ctaLink),
          overlayOpacity:
            typeof s?.overlayOpacity === 'number' ? s.overlayOpacity : undefined,
        };
      })
      .filter(Boolean) as HeroSlideView[];
    if (slides.length) return { slides, configured: true };
  }

  return {
    slides: TOUR_SCENES.map((src) => ({ type: 'image' as const, src })),
    configured: false,
  };
}

function SlideMedia({
  slide,
  index,
  reduce,
}: {
  slide: HeroSlideView;
  index: number;
  reduce: boolean;
}) {
  const mv = MOVES[index % MOVES.length];
  const common = {
    className: 'absolute inset-0 h-full w-full object-cover',
    initial: { opacity: 0, scale: mv.scale[0], x: mv.x[0], y: mv.y[0] },
    animate: { opacity: 1, scale: mv.scale[1], x: mv.x[1], y: mv.y[1] },
    exit: { opacity: 0 },
    transition: {
      opacity: { duration: 2, ease: 'easeInOut' as const },
      scale: { duration: SCENE_SECONDS + 2.5, ease: 'linear' as const },
      x: { duration: SCENE_SECONDS + 2.5, ease: 'linear' as const },
      y: { duration: SCENE_SECONDS + 2.5, ease: 'linear' as const },
    },
  };
  if (slide.type === 'video') {
    return (
      <motion.video
        key={index}
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={slide.poster}
        {...common}
      >
        <source src={slide.src} type="video/mp4" />
      </motion.video>
    );
  }
  return <motion.img key={index} src={slide.src} alt="" aria-hidden {...common} />;
}

function TourBurns({
  slides,
  active,
  reduce,
}: {
  slides: HeroSlideView[];
  active: number;
  reduce: boolean;
}) {
  const idx = slides.length ? active % slides.length : 0;
  const slide = slides[idx];

  if (reduce) {
    const first = slides[0];
    if (first?.type === 'video' && !first.poster) {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          >
            <source src={first.src} type="video/mp4" />
          </video>
        </div>
      );
    }
    const bg = first?.type === 'video' ? first.poster : first?.src;
    return (
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {slide ? <SlideMedia slide={slide} index={idx} reduce={reduce} /> : null}
      </AnimatePresence>
    </div>
  );
}

const TRUST: { icon: keyof typeof Icon; title: string; sub: string }[] = [
  { icon: 'sprout', title: 'Healthy Plants', sub: 'Carefully Handpicked' },
  { icon: 'truck', title: 'Pan India Delivery', sub: 'Fast & Safe' },
  { icon: 'shield', title: 'Safe Packaging', sub: 'Secure & Reliable' },
];

/** Functional delivery checker wired to the pincode serviceability allow-list. */
function PincodeChecker() {
  const { t } = useTranslation('common');
  const [pincode, setPincode] = React.useState('');
  const [submitted, setSubmitted] = React.useState('');
  const { result, loading, checked } = usePincodeServiceability(submitted);
  const serviceable = result?.serviceable;
  const isFetching = loading;
  return (
    <div className="mt-7 max-w-[432px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(pincode);
        }}
        className="flex items-center gap-2 rounded-xl bg-white py-[5px] pl-4 pr-[5px] shadow-[0_10px_26px_rgba(0,0,0,0.24)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#908A7E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
          <path d="M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="2.6" />
        </svg>
        <input
          value={pincode}
          inputMode="numeric"
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={t('home-hero-pincode-placeholder')}
          aria-label="Delivery pincode"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] text-forest-900 outline-none placeholder:text-stone-400"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[9px] bg-ds-btn px-[22px] py-[11px] text-[14px] font-bold text-white transition hover:bg-ds-btn-hover"
        >
          {isFetching ? t('home-hero-pincode-checking') : t('home-hero-pincode-check-cta')}
        </button>
      </form>
      {checked ? (
        <p className={`mt-[14px] text-[13px] font-medium ${serviceable ? 'text-[#7FC95E]' : 'text-amber-200'}`}>
          {serviceable
            ? t('home-hero-pincode-serviceable', { pincode: submitted })
            : t('home-hero-pincode-not-serviceable', { pincode: submitted })}
        </p>
      ) : (
        <p className="mt-[14px] flex items-center gap-[7px] text-[13px] text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.65)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="#7FC95E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12 2.3 2.3 4.7-4.7" />
          </svg>
          {t('home-hero-pincode-coverage')}
        </p>
      )}
    </div>
  );
}

export function HeroPlant() {
  const { t } = useTranslation('common');
  const { slides, configured } = useHeroSlides();
  const [reduce, setReduce] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const showHeroOffer = useBannerEnabled('heroOffer');

  React.useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  React.useEffect(() => {
    if (reduce || slides.length < 2) return;
    const t = setInterval(
      () => setActive((p) => (p + 1) % slides.length),
      SCENE_SECONDS * 1000,
    );
    return () => clearInterval(t);
  }, [slides.length, reduce]);

  const idx = slides.length ? active % slides.length : 0;
  const slide = slides[idx];

  // Copy/CTA overrides only apply when admin-configured slides supply them;
  // otherwise the built-in headline/sub/CTA render exactly as before.
  const headline = configured ? slide?.headline : undefined;
  const subheadline = configured ? slide?.subheadline : undefined;
  const ctaText = configured ? slide?.ctaText : undefined;
  const ctaLink = configured ? slide?.ctaLink : undefined;

  // Overlay darkness: k=1 (default) reproduces the current grade byte-for-byte.
  const k =
    configured && typeof slide?.overlayOpacity === 'number'
      ? Math.max(0, Math.min(100, slide.overlayOpacity)) / 100
      : 1;
  const gradeStyle = {
    background: `linear-gradient(96deg, rgba(8,20,12,${0.82 * k}) 0%, rgba(10,26,16,${0.62 * k}) 28%, rgba(10,26,16,${0.38 * k}) 55%, rgba(10,26,16,${0.12 * k}) 80%, rgba(10,26,16,${0.02 * k}) 100%)`,
  };

  return (
    <section className="relative min-h-[620px] w-full overflow-hidden bg-[#0c1e12]">
      <TourBurns slides={slides} active={active} reduce={reduce} />

      {/* premium green grade — protect the type on the left, reveal the room on the right */}
      <div className="absolute inset-0" style={gradeStyle} />
      <div className="absolute inset-0 bg-[#0C1F13]/30 lg:hidden" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#081209]/85 to-transparent" />
      {/* grain texture — editorial depth, breaks flat-green monotony */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] mix-blend-overlay opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-[205px] pt-[112px] max-lg:pb-[180px] sm:px-8 lg:px-16">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.7, ease: EXPO }}
            className="mb-7 inline-flex w-fit items-center gap-2.5 rounded-full border border-white/35 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90"
          >
            {t('home-hero-eyebrow')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0 text-[#8FD56F]" aria-hidden>
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6" />
            </svg>
          </motion.span>

          {headline ? (
            <motion.h1
              key={`h-${idx}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EXPO }}
              className="font-pahserif text-[2.4rem] font-bold leading-[1.12] tracking-[-0.02em] text-white sm:text-[3rem] lg:text-[3.6rem]"
            >
              {headline}
            </motion.h1>
          ) : (
            <h1 className="font-pahserif text-[2.4rem] font-bold leading-[1.12] tracking-[-0.02em] text-white sm:text-[3rem] lg:text-[3.6rem]">
              <span className="block lg:whitespace-nowrap">
                <WordReveal text={t('home-hero-title-1')} delay={0.1} />
              </span>
              <span className="block text-[#8FD56F]">
                <WordReveal text={t('home-hero-title-2')} delay={0.32} />
              </span>
            </h1>
          )}

          <motion.p
            key={`p-${configured ? idx : 'default'}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: headline ? 0.12 : 0.58, duration: 0.7, ease: EXPO }}
            className="mt-[22px] max-w-[432px] text-[17px] leading-[1.5] text-white/[0.86]"
          >
            {subheadline ?? t('home-hero-subtitle')}
          </motion.p>

          {ctaText && ctaLink ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: EXPO }}
              className="mt-7"
            >
              <Link
                href={ctaLink}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--ds-accent)] px-7 py-3.5 text-[14px] font-semibold text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] transition hover:bg-[#3f7327]"
              >
                {ctaText} <span aria-hidden>→</span>
              </Link>
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.65, duration: 0.6, ease: EXPO }}
            className="mt-8 h-px origin-left bg-gradient-to-r from-white/20 via-white/10 to-transparent"
          />
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.7, ease: EXPO }}
            className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            {TRUST.map((f, i) => {
              const Ico = Icon[f.icon];
              return (
                <React.Fragment key={f.title}>
                  {i > 0 && <span aria-hidden className="hidden h-8 w-px bg-white/20 sm:block" />}
                  <div className="flex items-center gap-[11px]">
                    <Ico className="h-5 w-5 shrink-0 text-[#8FD56F]" />
                    <div>
                      <div className="text-[13.5px] font-bold leading-tight text-white">{f.title}</div>
                      <div className="mt-0.5 text-[12px] leading-tight text-white/70">{f.sub}</div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </motion.div>

          <PincodeChecker />
        </div>
      </div>

      {/* offer pill — bottom-right, above category row overlap */}
      {showHeroOffer && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.65, duration: 0.8, ease: EXPO }}
          className="absolute right-5 top-1/2 z-[45] hidden -translate-y-1/2 lg:block sm:right-8 lg:right-[110px]"
        >
          <div className="flex items-center gap-4 rounded-[20px] border border-white/[0.14] bg-white/[0.08] px-5 py-4 backdrop-blur-2xl">
            {/* icon */}
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#4ADE80]/20 ring-1 ring-[#4ADE80]/25">
              <Icon.leaf className="h-[18px] w-[18px] text-[#4ADE80]" />
            </div>
            {/* text */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">{t('home-hero-offer-eyebrow')}</p>
              <span className="font-pahserif text-[2rem] font-bold leading-none text-white">{t('home-hero-offer-amount')}</span>
              <p className="mt-0.5 text-[10.5px] font-semibold leading-[1.4] text-[#86EFAC]">{t('home-hero-offer-subtitle')}</p>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}

export default HeroPlant;
