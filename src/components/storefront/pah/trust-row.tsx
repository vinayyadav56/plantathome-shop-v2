'use client';
import React from 'react';
import { Lock, RotateCcw, ShieldCheck, Truck } from '@/components/ui/icon';

const TRUST = [
  { label: 'Live Arrival Guarantee', icon: <ShieldCheck size={14} aria-hidden /> },
  { label: '100% Secure Payment', icon: <Lock size={14} aria-hidden /> },
  { label: 'Easy Returns & Refunds', icon: <RotateCcw size={14} aria-hidden /> },
  { label: 'Fast & Safe Delivery', icon: <Truck size={14} aria-hidden /> },
];

export function TrustRow() {
  return (
    <div className="mb-7 px-5">
      <div className="grid grid-cols-4 gap-1.5 rounded-[14px] border border-kraft-200 bg-white p-[12px_8px] shadow-[0_2px_8px_rgba(34,48,26,0.07)]">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-[5px]">
            <span className="shrink-0 text-forest-600">{t.icon}</span>
            <span className="text-[8.5px] font-semibold leading-[1.15] text-forest-900">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrustRow;
