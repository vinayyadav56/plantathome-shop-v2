'use client';
import { SearchBar } from './search-bar';
import React from 'react';
import Image from 'next/image';
import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import { useBannerEnabled } from '@/lib/use-home-config';
import LineIcon from '@/components/icons/line-icons';
import { useHeroSlides } from '@/components/storefront/home/hero-plant';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=70';

const CHIPS = [
  { label: 'Air Purifying', faClass: 'leaf' },
  { label: 'Easy Care', faClass: 'droplet' },
  { label: 'Fast Delivery', faClass: 'truck' },
];

export function Hero() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const showOffer = useBannerEnabled('heroOffer');
  const { slides } = useHeroSlides();
  const firstSlide = slides[0];
  const heroImg = firstSlide?.type === 'video'
    ? (firstSlide.poster ?? FALLBACK_IMG)
    : (firstSlide?.src ?? FALLBACK_IMG);

  return (
    <div className="relative pb-0">
      {/* Decorative backdrop but ALSO the mobile LCP element.
          This was a raw <img> of a 1672x941 JPEG — 242 KB, shipped at full size
          to a 390px phone and never touched by the optimizer, which measured as
          a 20.9s LCP on Slow-4G. Through next/image the same frame is ~27 KB of
          AVIF. `priority` emits its own preload with a correct imagesrcset, so
          the hand-rolled <link rel=preload> in app/(home)/page.tsx (which was
          media-gated to >=768px and therefore skipped the phone entirely) is
          gone. */}
      <Image
        src={heroImg}
        alt=""
        fill
        priority
        sizes="100vw"
        quality={70}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,30,18,0.72)_0%,rgba(15,30,18,0.34)_38%,rgba(15,30,18,0.26)_64%,rgba(15,30,18,0.40)_100%)]" />

      <div className="relative z-[2] px-5 pb-11 pt-6 text-white">
        {/* The in-hero app bar (hamburger / wordmark / cart) used to sit here.
            It was `relative`, so it scrolled away with the hero — and because
            the sticky site header was suppressed on the phone home to avoid
            doubling up with it, the homepage ended up with NO way to change the
            shopping city once you scrolled. Its hamburger opened the same
            MAIN_MENU_VIEW drawer the bottom nav's Categories tab opens, and its
            cart is the bottom nav's Cart tab, badge included — so removing it
            costs only the wordmark and gains a header that is always there. */}

        {/* hero body */}
        <div>
          <span className="mb-3.5 inline-flex items-center gap-[7px] rounded-full border border-[#86E0A3]/60 bg-[#0F1E12]/[0.55] px-[13px] py-[5px] font-hanken text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]" />{t('m-hero-badge')}
          </span>
          {/* <p>, not <h1>: the desktop hero's h1 is in the same DOM (the two
              homes are CSS-gated, not conditionally rendered), so this was a
              second h1 on every homepage response. */}
          <p className="m-0 whitespace-nowrap font-hanken text-[30px] font-medium leading-[1.12] tracking-[-0.02em] text-white">
            {t('m-hero-title-1')}<br /><span className="text-[#5FE08A]">{t('m-hero-title-2')}</span>
          </p>

          {/* chips pill (left) + offer card (right) */}
          <div className="mt-5 flex items-end justify-between gap-2">
            <div className="inline-flex shrink-0 items-stretch rounded-full bg-white/[0.96] px-[3px] py-[4px] shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
              {CHIPS.map((c, i) => (
                <React.Fragment key={c.label}>
                  {i > 0 ? <span className="my-[3px] w-px bg-kraft-200" /> : null}
                  <span className="inline-flex items-center gap-[3px] whitespace-nowrap px-[5px] py-0.5 text-[8.5px] font-bold text-forest-900">
                    <LineIcon name={c.faClass} className="h-[10px] w-[10px] text-forest-600" />
                    {c.label}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {showOffer ? (
              <div className="w-[104px] shrink-0 rounded-[14px] border border-white/20 bg-[#0D1C10]/[0.64] p-[9px_8px] text-center shadow-[0_10px_26px_rgba(0,0,0,0.32)]">
                <div className="mb-[3px] whitespace-nowrap text-[6.8px] font-semibold uppercase tracking-[0.05em] text-white/[0.82]">{t('m-hero-offer-eyebrow')}</div>
                <div className="whitespace-nowrap font-hanken text-[21px] font-extrabold leading-none text-white">40%<span className="text-[12px]"> {t('m-hero-offer-off')}</span></div>
                <div className="my-0.5 mb-2 text-[8px] text-white/[0.78]">{t('m-hero-offer-subtext')}</div>
                <button type="button" onClick={() => router.push('/plants/search')} className="inline-flex w-full items-center justify-center gap-1 rounded-[14px] bg-ds-btn px-1 py-1.5 font-hanken text-[10px] font-semibold text-white transition hover:bg-ds-btn-hover active:scale-95 active:bg-forest-800">
                  {t('m-hero-offer-cta')}
                  <LineIcon name="arrowRight" className="h-[10px] w-[10px]" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {/* Straddles the hero/sheet seam: half on the image, half on the cream
          (annotation 2026-10-03 — "tried too many times"; now it is anchored to the
          IMAGE box itself, so it can only sit on the picture's bottom edge). */}
      <SearchBar />
    </div>
  );
}

export default Hero;
