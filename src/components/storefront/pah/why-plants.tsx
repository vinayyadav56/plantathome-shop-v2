'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { PLACEHOLDER } from './_img';

/** Mobile "Why We Need Plants" — horizontal benefit-card carousel + closing CTA
 *  strip, matched to the Mobile Home reference (152px cards, 96px image, 46px icon
 *  badge straddling the image). */
const BENEFITS: { title: string; body: string; img: string; icon: React.ReactNode }[] = [
  { title: 'Purify the Air', body: 'Filters toxins and lifts oxygen for fresher air.', img: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=500&q=72&auto=format&fit=crop', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[21px] w-[21px]"><path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h9a2.5 2.5 0 1 1-2.5 2.5" /></svg>) },
  { title: 'Reduce Stress', body: 'Lowers stress and lifts your everyday mood.', img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&q=72&auto=format&fit=crop', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[21px] w-[21px]"><path d="M12 21c5-3 8-6.5 8-11a4 4 0 0 0-8-1 4 4 0 0 0-8 1c0 4.5 3 8 8 11Z" /></svg>) },
  { title: 'Boost Productivity', body: 'Improves focus at home and at work.', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=72&auto=format&fit=crop', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[20px] w-[20px]"><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>) },
  { title: 'Increase Humidity', body: 'Releases moisture for natural comfort.', img: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=500&q=72&auto=format&fit=crop', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[20px] w-[20px]"><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>) },
  { title: 'Reduce Noise', body: 'Natural sound barriers for a calmer home.', img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=72&auto=format&fit=crop', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[20px] w-[20px]"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m22 9-6 6" /><path d="m16 9 6 6" /></svg>) },
  { title: 'Support the Planet', body: 'Greener spaces absorb CO₂ and help the Earth.', img: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=500&q=72&auto=format&fit=crop', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[21px] w-[21px]"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" /></svg>) },
];

function CardImg({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = React.useState(false);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={err ? PLACEHOLDER : src} alt={alt} loading="lazy" onError={() => setErr(true)} className="absolute inset-0 h-full w-full object-cover" />;
}

export function WhyPlants() {
  const { t } = useTranslation('common');
  return (
    <div className="px-5 pb-2 pt-[30px]">
      {/* header */}
      <div className="mx-auto mb-5 max-w-[308px] text-center">
        <span className="inline-flex items-center gap-[7px] font-jost text-[10px] font-medium uppercase tracking-[0.22em] text-forest-600">
          <i className="fa-solid fa-seedling text-[12px] text-forest-500" aria-hidden />
          {t('m-why-eyebrow')}
        </span>
        <div className="mx-auto mt-2.5 h-0.5 w-[42px] rounded-full bg-forest-500" />
        <h2 className="font-pahserif mt-3 text-[30px] font-bold leading-[1.04] tracking-[-0.01em] text-forest-900">{t('m-why-title')}</h2>
        <p className="mt-2.5 text-[12.5px] leading-[1.55] text-stone-500">{t('m-why-subtitle')} <strong className="font-bold text-forest-700">{t('m-why-subtitle-strong')}</strong></p>
      </div>
      {/* carousel */}
      <div className="pah-scroll -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BENEFITS.map((b) => (
          <div key={b.title} className="relative w-[152px] shrink-0 overflow-hidden rounded-2xl border border-kraft-200 bg-white shadow-[0_2px_8px_rgba(34,48,26,0.07)]">
            <div className="relative h-[96px] bg-cream-100"><CardImg src={b.img} alt={b.title} /></div>
            <div className="absolute left-1/2 top-[96px] grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-sage-200 bg-white text-forest-700 shadow-[0_5px_14px_rgba(20,40,24,0.14)]">{b.icon}</div>
            <div className="px-[11px] pb-4 pt-[29px] text-center">
              <h3 className="text-[13px] font-bold leading-[1.2] text-forest-900">{b.title}</h3>
              <div className="mx-auto mb-[9px] mt-2 h-0.5 w-[22px] rounded-full bg-forest-500" />
              <p className="text-[10.5px] leading-[1.5] text-stone-500">{b.body}</p>
            </div>
          </div>
        ))}
      </div>
      {/* closing CTA strip */}
      <div className="mt-4 flex items-center gap-[11px] rounded-[13px] border border-kraft-200 bg-white py-2 pl-3 pr-2 shadow-[0_2px_8px_rgba(20,40,24,0.05)]">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-forest-800 text-white"><i className="fa-solid fa-seedling text-[15px]" aria-hidden /></span>
        <p className="min-w-0 flex-1 text-[11.5px] leading-[1.32] text-forest-900">{t('m-why-cta-text')} <strong className="font-bold">{t('m-why-cta-text-strong-1')}</strong> &amp; <strong className="font-bold">{t('m-why-cta-text-strong-2')}</strong></p>
        <Link href="/plants/search" className="inline-flex shrink-0 items-center gap-[5px] rounded-[9px] bg-forest-600 px-[14px] py-[9px] font-hanken text-[11.5px] font-bold text-white">{t('m-why-cta-button')}<i className="fa-solid fa-arrow-right text-[11px]" aria-hidden /></Link>
      </div>
    </div>
  );
}

export default WhyPlants;
