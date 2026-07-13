'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useBannerEnabled } from '@/lib/use-home-config';
import { PLACEHOLDER } from './_img';

/** Mobile "Corporate Gifting" section (sage card + hero photo + 4 reasons + dark
 *  assurance band), matched to the Mobile Home reference. Separate from the luxury
 *  gilded banner (pah/gifting.tsx) that follows it. */
const REASONS: { a: string; b: string; icon: string; size: number }[] = [
  { a: 'Better for People', b: '& Workspaces', icon: 'fa-leaf', size: 23 },
  { a: 'Elegant Gifts for', b: 'Every Occasion', icon: 'fa-gift', size: 22 },
  { a: 'Sustainable Choice', b: 'Greener Future', icon: 'fa-earth-americas', size: 22 },
  { a: 'Perfect for Clients', b: '& Employees', icon: 'fa-building', size: 22 },
];

const ASSURE: { title: string; sub: string; icon: string; size: number }[] = [
  { title: 'Curated with Care', sub: 'Premium plants, beautifully packaged.', icon: 'fa-shield-heart', size: 27 },
  { title: 'Customized for You', sub: 'Personal messages, branding & bulk options.', icon: 'fa-wand-magic-sparkles', size: 26 },
  { title: 'Pan India Delivery', sub: 'Timely, safe delivery across India.', icon: 'fa-truck-fast', size: 27 },
];

function HeroImg() {
  const [err, setErr] = React.useState(false);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={err ? PLACEHOLDER : 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=900&q=82&auto=format&fit=crop'} alt="Corporate plant gifting" loading="lazy" onError={() => setErr(true)} className="absolute inset-0 h-full w-full object-cover" />;
}

export function CorporateGifting() {
  const { t } = useTranslation('common');
  if (!useBannerEnabled('gifting')) return null;
  return (
    <div className="mx-5 mb-7 mt-[14px] rounded-[28px] bg-sage-100 pb-[24px] pl-[20px] pr-[20px] pt-[30px] shadow-[0_1px_3px_rgba(20,40,24,0.06)]">
      {/* hero photo */}
      <div className="relative mb-[20px] h-[182px] overflow-hidden rounded-[16px] shadow-[0_2px_8px_rgba(34,48,26,0.07)]"><HeroImg /></div>
      {/* copy */}
      <div className="text-center">
        <span className="font-jost inline-flex items-center gap-2 rounded-[999px] border-[1.5px] border-sage-400 bg-white px-[14px] py-[7px] text-[9.5px] font-medium uppercase tracking-[0.2em] text-forest-700">
          <i className="fa-solid fa-seedling" aria-hidden style={{ fontSize: '11px', color: '#3A6B33' }} />
          {t('m-gift-eyebrow')}
        </span>
        <h2 className="font-pahserif mt-[14px] text-[30px] font-semibold leading-[1.06] tracking-[-0.01em] text-forest-900">{t('m-gift-title-1')} <span className="text-forest-600">{t('m-gift-title-2')}</span></h2>
        <div className="mt-[13px] flex items-center justify-center gap-[10px]">
          <div className="h-px w-[58px] bg-kraft-300" />
          <i className="fa-solid fa-seedling" aria-hidden style={{ fontSize: '12px', color: '#4E8244' }} />
          <div className="h-px w-[58px] bg-kraft-300" />
        </div>
        <p className="mx-auto mt-[12px] max-w-[284px] text-[13px] leading-[1.55] text-[#33422F]">{t('m-gift-subtitle')}</p>
      </div>
      {/* 4 reasons (2x2) */}
      <div className="mt-[22px] grid grid-cols-2 gap-x-[10px] gap-y-[18px]">
        {REASONS.map((r) => (
          <div key={r.a} className="flex flex-col items-center gap-[9px] text-center">
            <span className="grid h-[52px] w-[52px] place-items-center rounded-full border border-sage-200 bg-white text-forest-700">
              <i className={`fa-solid ${r.icon}`} aria-hidden style={{ fontSize: `${r.size}px` }} />
            </span>
            <span className="text-[11.5px] font-semibold leading-[1.4] text-forest-900">{r.a}<br />{r.b}</span>
          </div>
        ))}
      </div>
      {/* CTA */}
      <Link href="/corporate-gifting" className="font-jost mt-[20px] inline-flex w-full items-center justify-center gap-[10px] rounded-[12px] bg-ds-btn p-[15px] text-[12px] font-semibold uppercase tracking-[0.13em] text-white transition-colors hover:bg-ds-btn-hover">
        <i className="fa-solid fa-gift" aria-hidden style={{ fontSize: '15px' }} />
        {t('m-gift-cta')}
      </Link>
      {/* assurance band */}
      <div className="mt-[18px] rounded-[16px] bg-forest-800 px-[18px] py-[4px]">
        {ASSURE.map((g, i) => (
          <div key={g.title} className={`relative flex items-center gap-[15px] py-[15px] ${i > 0 ? 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/[0.14] before:content-[\'\']' : ''}`}>
            <span className="shrink-0 text-gold-300">
              <i className={`fa-solid ${g.icon}`} aria-hidden style={{ fontSize: `${g.size}px` }} />
            </span>
            <div className="min-w-0">
              <div className="font-jost text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.12em] text-white">{g.title}</div>
              <div className="mt-[4px] text-[11.5px] leading-[1.45] text-white/[0.74]">{g.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CorporateGifting;
