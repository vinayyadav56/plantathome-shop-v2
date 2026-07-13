import React from 'react';
import type { PlantAttribute } from '@/types';

const Sun = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" /></svg>
);
const Drop = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z" /></svg>
);
const Temp = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>
);
const Humidity = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 4 12 2C11.5 4 10 7 8 8.5S5 13 5 15a7 7 0 0 0 7 7z" /></svg>
);
const Paw = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="1.8" /><circle cx="18" cy="8" r="1.8" /><circle cx="5" cy="9" r="1.8" /><path d="M8.5 14a3.5 3.5 0 0 1 7 0c0 1.5-1 2-1 3.5a2.5 2.5 0 0 1-5 0c0-1.5-1-2-1-3.5z" /></svg>
);
const Spark = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l1.6 5L19 8.5 14 10.5 12 16l-2-5.5L5 8.5 10.4 7 12 2z" /></svg>
);

export default function CareGuide({ pa }: { pa?: PlantAttribute | null }) {
  const items = [
    { icon: Sun, label: 'Light', value: pa?.sunlight || 'Bright, indirect light' },
    { icon: Drop, label: 'Water', value: pa?.water_requirement || 'Once every 7-10 days' },
    { icon: Temp, label: 'Temperature', value: pa?.temperature_range ? `${pa.temperature_range}°C` : '18°C - 30°C' },
    { icon: Humidity, label: 'Humidity', value: 'Moderate to High' },
    { icon: Paw, label: 'Pet Safety', value: pa?.pet_friendly ? 'Pet friendly' : 'Keep away from pets' },
    { icon: Spark, label: 'Maintenance', value: pa?.growth_rate ? `${pa.growth_rate} growth` : 'Easy to Care' },
  ];

  return (
    <section className="bg-[#FAF8F2]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <h2 className="font-poppins mb-6 text-[1.4rem] font-bold text-forest-700">Care Guide</h2>
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_-20px_rgba(34,48,26,0.25)] sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {items.map((it, i) => (
            <div
              key={it.label}
              className={`flex flex-col items-center gap-2 px-2 py-2 text-center ${i > 0 ? 'lg:border-l lg:border-kraft-200/70' : ''}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-sage-100 text-forest-700">
                <it.icon className="h-5 w-5" />
              </span>
              <span className="text-[12.5px] font-semibold text-forest-900">{it.label}</span>
              <span className="text-[11px] capitalize leading-tight text-stone-500">{it.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
