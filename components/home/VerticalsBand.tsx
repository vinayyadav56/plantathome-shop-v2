'use client';

import Link from 'next/link';
import { FadeUp } from '@/components/motion';
import { useVerticals } from '@/lib/hooks/useVerticals';

/** The "six worlds" editorial band. */
export function VerticalsBand() {
  const { verticals } = useVerticals();

  return (
    <section className="g-light-b py-20">
      <div className="container-wide">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-accent">All our worlds</p>
          <h2 className="mt-2 font-pahserif text-section font-semibold text-forest-ink">One home, six worlds</h2>
          <p className="mx-auto mt-2 max-w-lg text-forest-ink/60">
            From rare foliage to farm-fresh produce — everything to make your home grow.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {verticals.map((v, i) => (
            <FadeUp key={v.key} delay={i * 0.06}>
              <Link
                href={v.path}
                className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-3xl border border-forest/10 p-6 text-cream"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.scenes[0]}
                  alt={v.label}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-ink/85 via-forest-ink/25 to-transparent" />
                <div className="relative z-10">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-pahserif text-3xl font-semibold">{v.label}</h3>
                    {v.isComingSoon && (
                      <span className="rounded-full bg-cream/20 px-2 py-0.5 text-[10px] font-semibold uppercase backdrop-blur">Soon</span>
                    )}
                  </div>
                  <p className="text-sm text-cream/85">{v.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cta">
                    {v.isComingSoon ? 'Explore' : 'Shop now'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition group-hover:translate-x-1"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
