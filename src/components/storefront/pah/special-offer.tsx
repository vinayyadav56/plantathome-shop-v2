'use client';
import React from 'react';
import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import { useBannerEnabled } from '@/lib/use-home-config';
import { ArrowRight, Package, RotateCcw, Sprout, Truck, type LucideIcon } from '@/components/ui/icon';

const PERKS: { label: string; icon: LucideIcon }[] = [
  { label: 'Secure Packaging', icon: Package },
  { label: 'Live Plant Guarantee', icon: Sprout },
  { label: 'Easy Returns', icon: RotateCcw },
  { label: 'Fast & Safe Delivery', icon: Truck },
];

export function SpecialOffer() {
  const router = useRouter();
  const { t } = useTranslation('common');
  if (!useBannerEnabled('specialOffer')) return null;
  return (
    <div className="mb-6 px-5">
      <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#234a2a,#0e2012)] p-4 text-white shadow-[0_8px_24px_rgba(34,48,26,0.09)]">
        <div className="w-[112px] flex-none">
          <div className="mb-[5px] font-hanken text-[7.5px] font-bold uppercase tracking-[0.18em] text-[#DCC07A]">{t('m-offer-eyebrow')}</div>
          <div className="whitespace-nowrap font-hanken text-[18px] font-extrabold leading-none tracking-[-0.01em] text-[#DCC07A]">{t('m-offer-headline')}</div>
          <div className="mt-1 text-[9px] text-white/[0.72]">{t('m-offer-subtext')}</div>
          <button type="button" onClick={() => router.push('/plants/search')} className="mt-2.5 inline-flex items-center gap-[5px] rounded-[9px] bg-[#3A6B33] px-3 py-1.5 font-hanken text-[11px] font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.2)]">
            {t('m-offer-cta')}
            <ArrowRight size={12} aria-hidden style={{ color: '#fff' }} />
          </button>
        </div>
        <div className="flex min-w-0 flex-1 justify-between gap-[7px] border-l border-white/[0.16] pl-3.5">
          {PERKS.map((p) => (
            <div key={p.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center text-white/[0.92]">
              <span style={{ color: '#B3C9A8' }}><p.icon size={16} aria-hidden /></span>
              <span className="text-[8.5px] leading-[1.2]">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpecialOffer;
