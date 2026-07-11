'use client';

import Link from 'next/link';
import { FadeUp } from '@/components/motion';
import { useVerticals } from '@/lib/hooks/useVerticals';

/* ── Why plants — benefit cards ─────────────────────────────────────────────── */
const BENEFITS = [
  { t: 'Purify your air', d: 'Nature’s own filter — cleaner air, every breath.' },
  { t: 'Reduce stress', d: 'Greenery lowers cortisol and lifts your mood.' },
  { t: 'Boost focus', d: 'Plants at your desk sharpen productivity.' },
  { t: 'Add humidity', d: 'Natural moisture for skin, sinuses & sleep.' },
  { t: 'Quieten noise', d: 'Foliage softens sound for a calmer home.' },
  { t: 'Support the planet', d: 'Peat-free growing, carbon-neutral delivery.' },
];

export function WhyPlants() {
  return (
    <section className="container-wide py-20">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-accent">Why plants</p>
        <h2 className="mt-2 font-pahserif text-section font-semibold text-forest-ink">More than décor.</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((b, i) => (
          <FadeUp key={b.t} delay={i * 0.05}>
            <div className="card flex h-full items-start gap-4 p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-soft text-forest-accent">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 20c0-5 2.8-8.5 7-10-.3 5-3.4 8.5-7 10Zm0 0c0-4.2-2.5-7.3-6.2-8.5C6.1 16 9 19 12 20Z" fill="currentColor" /></svg>
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold text-forest-ink">{b.t}</h3>
                <p className="mt-1 text-sm text-forest-ink/65">{b.d}</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* ── Spring sale band ───────────────────────────────────────────────────────── */
export function SpringSaleBand() {
  const PERKS = ['Best quality', 'Expert care', 'Easy returns', 'Secure payments'];
  return (
    <section className="g-footer py-16 text-cream">
      <div className="container-wide flex flex-col items-center gap-8 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <span className="inline-flex animate-pulse items-center gap-2 rounded-full bg-cta/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cta">
            Limited time
          </span>
          <h2 className="mt-3 font-pahserif text-4xl font-semibold md:text-5xl">
            Up to <span className="text-cta">40% off</span> the plant sale
          </h2>
          <p className="mt-2 text-cream/70">Refresh your space for the season — while stocks last.</p>
          <Link href="/offers" className="btn-cta mt-6 inline-flex px-7 py-3.5">Shop the sale</Link>
        </div>
        <ul className="grid grid-cols-2 gap-4">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 rounded-2xl bg-cream/10 px-4 py-3 text-sm font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-cta"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Trust row ──────────────────────────────────────────────────────────────── */
export function TrustRow() {
  const ITEMS = [
    ['100% quality assured', 'Every plant hand-inspected'],
    ['Secure packaging', 'Water-locked, damage-free'],
    ['Loved by 10,000+', 'Happy plant parents'],
    ['Expert guidance', 'Free lifetime care support'],
  ];
  return (
    <section className="border-y border-forest/10 bg-forest-soft/40">
      <div className="container-wide grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
        {ITEMS.map(([t, d]) => (
          <div key={t} className="text-center">
            <p className="font-heading text-lg font-semibold text-forest-ink">{t}</p>
            <p className="mt-1 text-sm text-forest-ink/60">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Category row (top-level categories) ────────────────────────────────────── */
export function CategoryRow() {
  const { verticals } = useVerticals();
  const live = verticals.filter((v) => !v.isComingSoon).slice(0, 5);
  if (!live.length) return null;
  return (
    <section className="container-wide py-14">
      <div className="mb-7 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-accent">Shop by world</p>
        <h2 className="mt-1 font-pahserif text-section font-semibold text-forest-ink">Find your green</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {live.map((v) => (
          <Link key={v.key} href={v.path} className="group flex flex-col items-center gap-3 rounded-2xl border border-forest/10 bg-white p-5 text-center transition hover:-translate-y-1 hover:shadow-card">
            <div className="h-20 w-20 overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.scenes[0]} alt={v.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            </div>
            <span className="font-heading text-lg font-semibold text-forest-ink">{v.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Gifting band ───────────────────────────────────────────────────────────── */
export function GiftingBand() {
  return (
    <section className="container-wide py-20">
      <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-forest/10 bg-white md:grid-cols-2">
        <div className="p-10 lg:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">Corporate gifting</p>
          <h2 className="mt-2 font-pahserif text-4xl font-semibold text-forest-ink">Gifts that keep growing.</h2>
          <p className="mt-3 text-forest-ink/65">
            Curated, customisable plant gifts for teams, clients and celebrations — delivered pan-India with your branding.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-forest-ink/75">
            {['Curated with care', 'Custom branding & notes', 'Pan-India delivery'].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-forest-accent"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {x}
              </li>
            ))}
          </ul>
          <Link href="/offers" className="pa-btn pa-btn-primary mt-7 inline-flex">Explore gifting</Link>
        </div>
        <div className="relative h-64 md:h-full md:min-h-[24rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-villa-interior.jpg" alt="Corporate plant gifting" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}
