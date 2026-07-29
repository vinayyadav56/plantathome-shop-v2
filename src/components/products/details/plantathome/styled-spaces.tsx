'use client';
import React, { useRef } from 'react';
import { usePdpContent, resolveImageUrl } from '@/lib/use-home-config';
import { LineIcon } from '@/components/icons/line-icons';

const HD = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=70&auto=format&fit=crop`;

/** Built-in fallback tiles — admin config overlays these per-field. */
const SPACES = [
  { label: 'Living Room', id: '1600210492486-724fe5c67fb0' },
  { label: 'Bedroom', id: '1615529182904-14819c35db37' },
  { label: 'Home Office', id: '1586023492125-27b2c045efd7' },
  { label: 'Balcony', id: '1502672260266-1c1ef2d93688' },
  { label: 'Luxury Villa', id: '1616486338812-3dadae4b4ace' },
  { label: 'Hotel Lobby', id: '1522444195799-478538b28823' },
];

export default function StyledSpaces() {
  const railRef = useRef<HTMLDivElement>(null);
  const cfg = usePdpContent()?.styledSpaces ?? null;

  const heading = cfg?.heading || 'Styled in Real Spaces';
  const subtitle = cfg?.subtitle || null;

  // Admin tiles replace the list; each tile still overlays PER-FIELD against
  // the same-index built-in (missing image/caption falls back, never blanks).
  const tiles = (cfg?.tiles?.length ? cfg.tiles : SPACES).map((t: any, i) => {
    const fallback = SPACES[i % SPACES.length];
    return {
      image: (t.image !== undefined ? resolveImageUrl(t.image ?? null) : '') || HD(fallback.id),
      caption: t.caption || t.label || fallback.label,
    };
  });

  const scroll = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className="bg-[#FAF8F2]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <h2 className="text-[15px] font-medium uppercase tracking-[0.08em] text-[#184A31]">{heading}</h2>
        {subtitle && <p className="mt-1 text-[14px] text-[#5B5B5B]">{subtitle}</p>}
        <div className="relative mt-5">
          {/* horizontally scrollable tile rail — arrows scroll it */}
          <div
            ref={railRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tiles.map((t, i) => (
              <div
                key={`${t.caption}-${i}`}
                className="group w-[46%] shrink-0 snap-start overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)] sm:w-[31%] lg:w-[calc((100%-60px)/6)]"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image}
                    alt={t.caption}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.visibility = 'hidden';
                    }}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="py-2.5 text-center text-[12px] font-medium text-[#184A31]">
                  {t.caption}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="absolute -left-3 top-[40%] hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#ECECEC] bg-white text-[#184A31] shadow-sm transition hover:bg-[#F3F8EC] lg:grid"
          >
            <LineIcon name="chevronLeft" className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="absolute -right-3 top-[40%] hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-[#ECECEC] bg-white text-[#184A31] shadow-sm transition hover:bg-[#F3F8EC] lg:grid"
          >
            <LineIcon name="chevronRight" className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
}
