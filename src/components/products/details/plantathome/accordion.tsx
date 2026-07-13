'use client';
import React, { useState } from 'react';

export type AccordionItem = { title: string; content: React.ReactNode };

const PlantAtHomeAccordion: React.FC<{ items: AccordionItem[]; defaultOpen?: number }> = ({
  items,
  defaultOpen = 0,
}) => {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-kraft-300/70 bg-white/40 transition"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-semibold text-forest-900">{item.title}</span>
              <span className="grid h-6 w-6 shrink-0 place-items-center text-clay-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M5 12h14" />
                  {!isOpen && <path d="M12 5v14" />}
                </svg>
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-6 pt-0 text-[15px] leading-7 text-stone-600">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlantAtHomeAccordion;
