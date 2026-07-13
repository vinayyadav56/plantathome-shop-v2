'use client';
import React from 'react';

// Staging-only palette picker: 5 green options the user can flip live.
// Deep links: ?green=1..5 ; choice persists in localStorage.
const PALETTES = [
  { n: '1', name: 'Soft Mint Wash', dot: '#C4E8D2', num: '#14532D' },
  { n: '2', name: 'Spring Gradient', dot: '#A9DEC2', num: '#11402A' },
  { n: '3', name: 'Lime Fresh', dot: '#CBEBAD', num: '#2F5618' },
  { n: '4', name: 'Aqua Breeze', dot: '#B9EADD', num: '#0C4A3E' },
  { n: '5', name: 'Gradient Green', dot: '#4CAF7D', num: '#FFFFFF' },
];

const IS_STAGING =
  (process.env.NEXT_PUBLIC_SITE_URL ?? '').includes('staging');

export default function GreenPicker() {
  const [active, setActive] = React.useState('1');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('green');
    const saved = window.localStorage.getItem('green');
    setOpen(window.innerWidth >= 768);
    const n = fromUrl && PALETTES.some((p) => p.n === fromUrl) ? fromUrl : saved && PALETTES.some((p) => p.n === saved) ? saved : '1';
    apply(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply(n: string) {
    document.documentElement.dataset.green = n;
    window.localStorage.setItem('green', n);
    setActive(n);
  }

  if (!IS_STAGING) return null;

  return (
    <div className="fixed bottom-20 right-3 z-[90] lg:bottom-3">
      {open ? (
        <div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/95 py-1.5 pl-2.5 pr-1.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)] backdrop-blur">
          <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-stone-400">Green</span>
          {PALETTES.map((p) => (
            <button
              key={p.n}
              type="button"
              title={`${p.n}. ${p.name}`}
              aria-label={`Use palette ${p.name}`}
              onClick={() => apply(p.n)}
              className={`grid h-5 w-5 place-items-center rounded-full transition ${
                active === p.n ? 'ring-2 ring-offset-1 ring-[#B58E39]' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: p.dot }}
            >
              <span className="text-[9px] font-bold" style={{ color: p.num }}>{p.n}</span>
            </button>
          ))}
          <button
            type="button"
            aria-label="Hide palette picker"
            onClick={() => setOpen(false)}
            className="ml-0.5 grid h-5 w-5 place-items-center rounded-full text-stone-400 hover:bg-black/5"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Show palette picker"
          onClick={() => setOpen(true)}
          className="grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white/95 text-[11px] shadow-lg backdrop-blur"
          style={{ color: PALETTES.find((p) => p.n === active)?.dot }}
        >
          ●
        </button>
      )}
    </div>
  );
}
