import React from 'react';
import type { PlantAttribute } from '@/types';
import { Sun, Droplet, Thermometer, TrendingUp, Droplets, PawPrint } from '@/components/ui/icon';

export default function CareGuide({ pa }: { pa?: PlantAttribute | null }) {
  const items = [
    { icon: <Sun size={20} aria-hidden />, label: 'Light', value: pa?.sunlight || 'Bright, indirect light' },
    { icon: <Droplet size={20} aria-hidden />, label: 'Water', value: pa?.water_requirement || 'Once every 7-10 days' },
    { icon: <Thermometer size={20} aria-hidden />, label: 'Temperature', value: pa?.temperature_range ? `${pa.temperature_range}°C` : '18°C - 30°C' },
    { icon: <Droplets size={20} aria-hidden />, label: 'Humidity', value: 'Moderate to High' },
    { icon: <PawPrint size={20} aria-hidden />, label: 'Pet Safety', value: pa?.pet_friendly ? 'Pet friendly' : 'Keep away from pets' },
    { icon: <TrendingUp size={20} aria-hidden />, label: 'Maintenance', value: pa?.growth_rate ? `${pa.growth_rate} growth` : 'Easy to Care' },
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
