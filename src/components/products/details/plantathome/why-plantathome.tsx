import React from 'react';

const Hand = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>
);
const Box = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" /></svg>
);
const Heart = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
);
const Headset = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-3v-7h5zM3 19a2 2 0 0 0 2 2h3v-7H3z" /></svg>
);

const ITEMS = [
  { icon: Hand, title: 'Hand Picked', sub: 'by Plant Experts' },
  { icon: Box, title: 'Secure Packaging', sub: 'Safe Delivery' },
  { icon: Heart, title: 'Loved by 50,000+', sub: 'Plant Parents' },
  { icon: Headset, title: 'Dedicated Support', sub: 'We&apos;re Here to Help' },
];

export default function WhyPlantAtHome() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_12px_34px_-22px_rgba(34,48,26,0.28)] sm:p-5">
      <h3 className="font-poppins text-[1.05rem] font-bold text-forest-700">Why PlantAtHome?</h3>
      <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ITEMS.map((it) => (
          <div key={it.title} className="flex flex-col items-center gap-1.5 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-100 text-forest-700">
              <it.icon className="h-[18px] w-[18px]" />
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
