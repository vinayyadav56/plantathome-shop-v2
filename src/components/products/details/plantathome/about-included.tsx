import React from 'react';
import type { Product } from '@/types';

const Check = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);
const Play = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
);

const INCLUDED = (name: string) => [
  `Healthy ${name}`,
  'Premium Designer Pot',
  'PlantAtHome Care Guide',
  'Nutrient Feed Pack',
  'Premium Packaging',
  'Plant Replacement Guarantee',
];

export default function AboutIncluded({ product, content }: { product: Product; content?: string }) {
  const { name, image } = product as any;
  const videoUrl = (product as any)?.video?.[0]?.url as string | undefined;
  const img = image?.original || image?.thumbnail || '';
  const text = (content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <section className="bg-[#FAF8F2]">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 sm:px-8 lg:grid-cols-3">
        {/* About */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_34px_-22px_rgba(34,48,26,0.28)]">
          <h3 className="font-poppins text-[1.2rem] font-bold text-forest-700">About {name}</h3>
          <p className="mt-3 text-[13.5px] leading-7 text-stone-600">
            {text ||
              `At PlantAtHome, each ${name} is hand-picked and delivered in a premium pot to elevate your space — nurtured to arrive healthy, lush and ready to thrive.`}
          </p>
          <span className="font-caveat mt-4 inline-block text-[1.3rem] leading-none text-forest-500">~ grown with care</span>
        </div>

        {/* Video / lifestyle */}
        <a
          href={videoUrl || '#'}
          {...(videoUrl ? { target: '_blank', rel: 'noreferrer' } : { onClick: (e: any) => e.preventDefault() })}
          className="group relative block min-h-[260px] overflow-hidden rounded-2xl bg-forest-900 shadow-[0_12px_34px_-22px_rgba(34,48,26,0.4)]"
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={name} className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-forest-700 shadow-lg transition group-hover:scale-110">
              <Play className="h-6 w-6 translate-x-0.5" />
            </span>
          </span>
        </a>

        {/* What's Included */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_12px_34px_-22px_rgba(34,48,26,0.28)]">
          <h3 className="font-poppins text-[1.2rem] font-bold text-forest-700">What&apos;s Included</h3>
          <ul className="mt-4 space-y-2.5">
            {INCLUDED(name).map((it) => (
              <li key={it} className="flex items-center gap-2.5 text-[13.5px] text-stone-700">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-600 text-white">
                  <Check />
                </span>
                {it}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
