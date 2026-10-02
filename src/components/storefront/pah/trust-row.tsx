'use client';
import React from 'react';
import { Lock, RotateCcw, ShieldCheck, Truck } from '@/components/ui/icon';

const TRUST = [
  { label: 'Live Arrival Guarantee', icon: <ShieldCheck size={18} aria-hidden /> },
  { label: '100% Secure Payment', icon: <Lock size={18} aria-hidden /> },
  { label: 'Easy Returns & Refunds', icon: <RotateCcw size={18} aria-hidden /> },
  { label: 'Fast & Safe Delivery', icon: <Truck size={18} aria-hidden /> },
];

/**
 * The cream pre-footer band, mobile edition (annotation 2026-10-03: "expecting
 * that cream color strip here" instead of the dead gap). Mirrors the desktop
 * TrustRow (home/trust-row.tsx): edge-to-edge #F0EDE4, kraft hairline, white
 * icon chips — so the phone page ends exactly like the desktop one.
 */
export function TrustRow() {
  return (
    <div className="border-t border-kraft-300/70 bg-[#F0EDE4] px-5 py-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-forest-700 shadow-[0_2px_8px_rgba(34,48,26,0.08)]">
              {t.icon}
            </span>
            <span className="text-[11.5px] font-bold leading-[1.2] text-forest-900">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrustRow;
