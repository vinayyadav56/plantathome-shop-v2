import React from 'react';
import type { PlantAttribute } from '@/types';
import { Sun, Droplet, Thermometer, Sparkles } from '@/components/ui/icon';

const Humidity = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 4 12 2C11.5 4 10 7 8 8.5S5 13 5 15a7 7 0 0 0 7 7z" /></svg>
);
const Paw = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="4" r="1.8" /><circle cx="18" cy="8" r="1.8" /><circle cx="5" cy="9" r="1.8" /><path d="M8.5 14a3.5 3.5 0 0 1 7 0c0 1.5-1 2-1 3.5a2.5 2.5 0 0 1-5 0c0-1.5-1-2-1-3.5z" /></svg>
);

export default function CareGuide({ pa }: { pa?: PlantAttribute | null }) {
  const items = [
    { icon: <Sun size={20} aria-hidden />, label: 'Light', value: pa?.sunlight || 'Bright, indirect light' },
    { icon: <Droplet size={20} aria-hidden />, label: 'Water', value: pa?.water_requirement || 'Once every 7-10 days' },
    { icon: <Thermometer size={20} aria-hidden />, label: 'Temperature', value: pa?.temperature_range ? `${pa.temperature_range}°C` : '18°C - 30°C' },
    { icon: <Humidity className="h-5 w-5" />, label: 'Humidity', value: 'Moderate to High' },
    { icon: <Paw className="h-5 w-5" />, label: 'Pet Safety', value: pa?.pet_friendly ? 'Pet friendly' : 'Keep away from pets' },
    { icon: <Sparkles size={20} fill="currentColor" aria-hidden />, label: 'Maintenance', value: pa?.growth_rate ? `${pa.growth_rate} growth` : 'Easy to Care' },
  ];

  return (
    <section className="bg-[#FAF8F2]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <h2 className="font-poppins mb-5 text-[15px] font-medium uppercase tracking-[0.08em] text-forest-700">Care Guide</h2>
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_-20px_rgba(34,48,26,0.25)] sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {items.map((it, i) => (
            <div
              key={it.label}
              className={`flex flex-col items-center gap-2 px-2 py-2 text-center ${i > 0 ? 'lg:border-l lg:border-kraft-200/70' : ''}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-sage-100 text-forest-700">
                {it.icon}
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
