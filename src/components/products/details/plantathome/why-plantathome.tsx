import React from 'react';
import {
  Hand,
  Headset,
  Heart,
  Package,
} from '@/components/ui/icon';

const ITEMS = [
  { icon: <Hand size={18} aria-hidden />, title: 'Hand Picked', sub: 'by Plant Experts' },
  { icon: <Package size={18} aria-hidden />, title: 'Secure Packaging', sub: 'Safe Delivery' },
  { icon: <Heart size={18} aria-hidden />, title: 'Loved by 50,000+', sub: 'Plant Parents' },
  { icon: <Headset size={18} aria-hidden />, title: 'Dedicated Support', sub: 'We&apos;re Here to Help' },
];

export default function WhyPlantAtHome() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_12px_34px_-22px_rgba(34,48,26,0.28)] sm:p-5">
      <h3 className="font-poppins text-[13px] font-medium uppercase tracking-[0.08em] text-forest-700">Why PlantAtHome?</h3>
      <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ITEMS.map((it) => (
          <div key={it.title} className="flex flex-col items-center gap-1.5 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-100 text-forest-700">
              {it.icon}
            </span>
            <span className="text-[11.5px] font-semibold leading-tight text-forest-900">{it.title}</span>
            <span
              className="text-[10px] leading-tight text-stone-500"
              dangerouslySetInnerHTML={{ __html: it.sub }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
