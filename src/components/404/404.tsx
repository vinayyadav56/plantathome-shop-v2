import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';

/**
 * Branded 404 / dead-end page.
 *
 * Replaces the Pickbazar default, which shipped a 305 KB `no-result.svg` (the
 * single largest static asset in the bundle) on a bare grey page. The plant
 * glyph here is the same inline SVG the branded empty states use
 * (ui/empty-products.tsx) — a few hundred bytes, brand greens.
 *
 * Prop-compatible with the old component ON PURPOSE: lib/private-route.tsx
 * renders this with custom title/subTitle/link/linkTitle for the licence
 * trust-gate (417) case, so the signature must not change. The `image` prop is
 * accepted and ignored — the only image ever passed was the default (the
 * 305 KB SVG this rewrite deletes).
 */

type NotFoundProps = {
  title?: string;
  subTitle?: string;
  image?: string;
  link?: string;
  linkTitle?: string;
};

/** Rotating "did you know" plant facts — small, static, no fetch. */
const PLANT_FACTS = [
  'Snake plants release oxygen at night — most plants only do it by day.',
  'A NASA study found common houseplants can filter indoor air pollutants.',
  'Money plants root from a single cutting in plain water.',
  'Peace lilies droop dramatically when thirsty — and perk up within hours of watering.',
  'Areca palms are natural humidifiers, releasing moisture as they transpire.',
  'Most succulents prefer being under-watered to over-watered.',
];

function PlantFacts() {
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    if (mq.matches) return; // static single fact under reduced motion
    const t = setInterval(() => setI((v) => (v + 1) % PLANT_FACTS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="mx-auto mt-10 max-w-md rounded-2xl border border-kraft-200 bg-sage-100/60 px-6 py-4"
      aria-live={reduced ? undefined : 'polite'}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-600">
        While you&apos;re here — did you know?
      </p>
      {/* key swap re-triggers the CSS fade on each rotation */}
      <p key={i} className="pah-fade-in text-sm leading-relaxed text-stone-600">
        {PLANT_FACTS[i]}
      </p>
    </div>
  );
}

/** The brand plant-pot glyph (same as ui/empty-products.tsx) — inline, ~600B. */
function PlantGlyph() {
  return (
    <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_35%,#EAF4E6,#F6FAF7)] sm:h-44 sm:w-44">
      <svg viewBox="0 0 120 120" className="h-24 w-24 sm:h-28 sm:w-28" fill="none" aria-hidden focusable="false">
        <path d="M60 70c0-20 9-32 26-36 0 18-9 30-26 36Z" fill="#6E8B4A" />
        <path d="M60 70c0-16-7-26-21-29 0 15 7 24 21 29Z" fill="#4E8B31" />
        <path d="M60 62c0-11 5-18 15-21 0 11-5 17-15 21Z" fill="#35C46A" />
        <path d="M60 36v34" stroke="#2E5E2A" strokeWidth="2" strokeLinecap="round" />
        <rect x="33" y="68" width="54" height="10" rx="3" fill="#D7C9AE" stroke="#C9B79A" strokeWidth="2" />
        <path d="M36 74h48l-5 28a6 6 0 0 1-6 5H47a6 6 0 0 1-6-5L36 74Z" fill="#E9E3D6" stroke="#C9B79A" strokeWidth="2" />
      </svg>
    </div>
  );
}

const NotFound: React.FC<NotFoundProps> = ({
  title = '404-heading',
  subTitle = '404-sub-heading',
  link = Routes.home,
  linkTitle = '404-back-home',
}) => {
  const { t } = useTranslation();
  // Custom-prop mode (PrivateRoute's 417 case) keeps a single-link layout;
  // the default 404 gets the full page with quick links + facts.
  const isDefault = title === '404-heading';

  return (
    <div className="grid min-h-[75vh] place-items-center bg-cream px-4 py-14 sm:px-8">
      <div className="w-full max-w-2xl text-center">
        <PlantGlyph />

        <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          {isDefault ? 'Error 404' : t(title)}
        </p>
        <h1 className="mx-auto mb-4 max-w-xl text-2xl font-bold leading-snug text-forest-900 sm:text-3xl">
          {isDefault
            ? 'This page seems to have wandered off the garden path.'
            : t(subTitle)}
        </h1>

        {isDefault ? (
          <>
            <p className="mx-auto mb-9 max-w-md text-sm leading-relaxed text-stone-600">
              The link may be old, or the page was re-potted somewhere else.
              Everything green is still exactly where you left it.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={Routes.home}
                className="w-full rounded-lg bg-ds-btn px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-ds-btn-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 sm:w-auto"
              >
                {t('404-back-home')}
              </Link>
              <Link
                href={Routes.coupons}
                className="w-full rounded-lg border border-kraft-200 bg-white px-7 py-3 text-sm font-semibold text-forest-900 transition-colors hover:bg-sage-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 sm:w-auto"
              >
                Today&apos;s offers
              </Link>
              <Link
                href={Routes.trackOrder}
                className="w-full rounded-lg border border-kraft-200 bg-white px-7 py-3 text-sm font-semibold text-forest-900 transition-colors hover:bg-sage-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 sm:w-auto"
              >
                Track your order
              </Link>
            </div>

            <PlantFacts />

            <p className="mt-8 text-xs text-stone-500">
              Still lost?{' '}
              <Link
                href={Routes.contactUs}
                className="font-semibold text-forest-700 underline hover:no-underline"
              >
                Talk to us
              </Link>
            </p>
          </>
        ) : (
          <Link
            href={link}
            className="mt-2 inline-flex items-center font-semibold text-forest-700 underline hover:text-forest-900 hover:no-underline focus:outline-none"
          >
            {t(linkTitle)}
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
