'use client';

import Link from 'next/link';
import { useVerticals } from '@/lib/hooks/useVerticals';

export default function CategoriesPage() {
  const { verticals } = useVerticals();

  return (
    <div className="container-wide py-12">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-accent">Browse everything</p>
        <h1 className="mt-2 font-pahserif text-section font-semibold text-forest-ink">All categories</h1>
      </div>

      <div className="space-y-12">
        {verticals.map((v) => (
          <section key={v.key}>
            <div className="mb-5 flex items-center justify-between">
              <Link href={v.path} className="group flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-forest/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.scenes[0]} alt={v.label} className="h-full w-full object-cover" />
                </div>
                <h2 className="font-pahserif text-3xl font-semibold text-forest-ink group-hover:text-forest">{v.label}</h2>
                {v.isComingSoon && <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-clay">soon</span>}
              </Link>
              <Link href={v.path} className="text-sm font-semibold text-forest-accent hover:text-forest">Shop all →</Link>
            </div>
            {v.subcategories.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {v.subcategories.map((c) => (
                  <Link key={c.uuid} href={`/c/${c.slug}`} className="rounded-xl border border-forest/10 bg-white px-4 py-3 text-sm font-medium text-forest-ink transition hover:border-forest-accent/40 hover:bg-forest-soft">
                    {c.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-forest-ink/50">{v.isComingSoon ? 'Arriving soon.' : 'Explore this world →'}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
