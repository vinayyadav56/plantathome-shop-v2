'use client';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import PageBanner from '@/components/banners/page-banner';
import { getVerticalMeta } from '@/components/storefront/verticals';
import SafeImage from '@/components/ui/safe-image';
import { ArrowRight } from '@/components/ui/icon';
import { Routes } from '@/config/routes';

type Props = {
  /** The vertical (type) slug. */
  slug: string;
  name?: string | null;
  /** The admin's Coming Soon message; the vertical's blurb when there is none. */
  message?: string | null;
  /** The tile alone: a Coming Soon product's buy box, the vertical's home section, /categories. */
  compact?: boolean;
};

/**
 * A COMING SOON vertical: the API lists it (`availability.status: coming_soon`) so it can be
 * shown, and refuses its orders. The page replaces the vertical's landing, search, categories
 * and category pages; the compact tile stands in for its buy buttons and product rails.
 *
 * Built only from what the storefront already has: the vertical's scene, tagline and blurb
 * (verticals.ts), the verticals band's gold chip, the /categories teaser tile, PageBanner and
 * the pa-btn CTAs.
 */
export default function ComingSoon({ slug, name, message, compact = false }: Props) {
  const { t } = useTranslation('common');
  const meta = getVerticalMeta(slug, name ?? undefined);
  const label = name || meta.label;
  const copy = message?.trim() || meta.blurb;
  const chip = (
    <span className="w-fit rounded-full bg-[#D4A44B] px-3 py-1 font-hanken text-[10px] font-bold uppercase tracking-[0.14em] text-[#231A05]">
      {t('text-coming-soon')}
    </span>
  );

  if (compact) {
    // Grows with a long admin message instead of clipping it (the teaser had a fixed height).
    return (
      <div className="relative overflow-hidden rounded-2xl border border-kraft-200 bg-forest-900 shadow-box">
        <SafeImage
          src={meta.scenes[0]}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 80vw"
          quality={70}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(5,16,8,0.86)_0%,rgba(5,16,8,0.6)_55%,rgba(5,16,8,0.3)_100%)]" />
        <div className="relative flex min-h-[150px] flex-col justify-center gap-2 px-6 py-6 sm:min-h-[170px] sm:px-8">
          {chip}
          <p className="m-0 font-pahserif text-[22px] font-medium leading-tight text-white">{label}</p>
          <p className="m-0 max-w-md font-hanken text-[14px] leading-snug text-white/85">{copy}</p>
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" className="bg-page">
      <PageBanner title={label} breadcrumbTitle={t('text-home')} />
      <div className="mx-auto max-w-4xl px-5 pb-14 pt-8 text-center sm:px-8 sm:pb-20 sm:pt-10">
        <div className="relative h-[220px] overflow-hidden rounded-2xl border border-kraft-200 bg-forest-900 text-left shadow-box sm:h-[300px] lg:h-[340px]">
          <SafeImage
            src={meta.scenes[0]}
            alt=""
            fill
            priority
            sizes="(max-width: 896px) 100vw, 832px"
            quality={70}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,16,8,0.85)_0%,rgba(5,16,8,0.35)_50%,rgba(5,16,8,0.05)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6 sm:p-8 lg:p-10">
            {chip}
            <p className="m-0 font-pahserif text-[26px] font-medium leading-[1.1] text-white sm:text-[34px] lg:text-[40px]">
              {meta.tagline}
            </p>
          </div>
        </div>
        <p className="mx-auto mt-7 max-w-xl font-hanken text-[15px] leading-relaxed text-stone-600 sm:text-[16px]">
          {copy}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/plants" className="pa-btn pa-btn-primary">
            Shop plants
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href={Routes.home} className="pa-btn pa-btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody(props: Omit<Props, 'compact'>) {
  return getSiteLayout(<ComingSoon {...props} />);
}
