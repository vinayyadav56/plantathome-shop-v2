import React from 'react';

const HD = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=600&q=70&auto=format&fit=crop`;

const SPACES = [
  { label: 'Living Room', id: '1600210492486-724fe5c67fb0' },
  { label: 'Bedroom', id: '1615529182904-14819c35db37' },
  { label: 'Home Office', id: '1586023492125-27b2c045efd7' },
  { label: 'Balcony', id: '1502672260266-1c1ef2d93688' },
  { label: 'Luxury Villa', id: '1616486338812-3dadae4b4ace' },
  { label: 'Hotel Lobby', id: '1522444195799-478538b28823' },
];

const Arrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
  </svg>
);

export default function StyledSpaces() {
  return (
    <section className="bg-[#FAF8F2]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <h2 className="font-poppins mb-5 text-[1.4rem] font-bold text-forest-700">Styled in Real Spaces</h2>
        <div className="relative">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {SPACES.map((s) => (
              <div key={s.label} className="group overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_-18px_rgba(34,48,26,0.25)]">
                <div className="aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={HD(s.id)} alt={s.label} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="py-2.5 text-center text-[12px] font-medium text-forest-900">{s.label}</div>
              </div>
            ))}
          </div>
          <button type="button" aria-label="Scroll left" className="absolute -left-3 top-[40%] hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-kraft-300 bg-white text-forest-900 shadow-sm lg:grid">
            <Arrow dir="left" />
          </button>
          <button type="button" aria-label="Scroll right" className="absolute -right-3 top-[40%] hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-kraft-300 bg-white text-forest-900 shadow-sm lg:grid">
            <Arrow dir="right" />
          </button>
        </div>
      </div>
    </section>
  );
}
