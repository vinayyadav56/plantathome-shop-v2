'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KenBurns, FadeUp, WordReveal } from '@/components/motion';
import { ProductRail } from '@/components/products/ProductRail';
import { useVertical } from '@/lib/hooks/useVerticals';
import { getVertical } from '@/lib/verticals';

const PROMISE_ICON: Record<string, string> = {
  truck: 'M3 7h11v8H3zM14 10h4l3 3v2h-7z',
  truckFast: 'M3 7h11v8H3zM14 10h4l3 3v2h-7z',
  shield: 'M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6z',
  spark: 'M12 3v6M12 15v6M3 12h6M15 12h6',
  leaf: 'M5 19c7 0 14-4 14-14C12 5 5 9 5 19z',
  droplet: 'M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z',
  sun: 'M12 4v2M12 18v2M4 12h2M18 12h2',
};

export function VerticalView({ slug }: { slug: string }) {
  const meta = getVertical(slug);
  const resolved = useVertical(slug);
  if (!meta) return notFound();

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[62vh] items-center overflow-hidden">
        <KenBurns images={meta.scenes} interval={6} />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-ink/90 via-forest-ink/40 to-forest-ink/25" />
        <div className="container-wide relative z-10 py-20 text-cream">
          <FadeUp>
            <nav className="mb-4 flex items-center gap-2 text-sm text-cream/70">
              <Link href="/" className="hover:text-cream">Home</Link>
              <span>/</span>
              <span className="text-cream">{meta.label}</span>
            </nav>
          </FadeUp>
          <h1 className="max-w-3xl font-pahserif text-[clamp(2.6rem,1.8rem+4vw,4.5rem)] font-semibold leading-[1.03]">
            <WordReveal text={meta.tagline} />
          </h1>
          <FadeUp delay={0.2}>
            <p className="mt-4 max-w-xl text-lg text-cream/85">{meta.blurb}</p>
          </FadeUp>
          {meta.comingSoon && (
            <FadeUp delay={0.3}>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream/15 px-4 py-2 text-sm font-medium backdrop-blur">
                Coming soon — join the waitlist below
              </span>
            </FadeUp>
          )}
        </div>
      </section>

      {/* Subcategory grid */}
      {resolved && resolved.subcategories.length > 0 && (
        <section className="container-wide py-12">
          <h2 className="mb-6 font-pahserif text-section font-semibold text-forest-ink">Shop by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {resolved.subcategories.map((c, i) => (
              <FadeUp key={c.uuid} delay={i * 0.04}>
                <Link
                  href={`/c/${c.slug}`}
                  className="group relative flex h-32 items-end overflow-hidden rounded-2xl border border-forest/10 p-4 text-cream"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={meta.scenes[i % meta.scenes.length]} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-ink/80 to-transparent" />
                  <span className="relative z-10 font-heading text-lg font-semibold">{c.name}</span>
                </Link>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {!meta.comingSoon && (
        <ProductRail
          title={`All ${meta.label}`}
          eyebrow="The collection"
          categoryUuids={resolved?.categoryUuids ?? []}
          limit={24}
          viewAllHref={`/products?world=${slug}`}
          viewAllLabel="Open full listing"
        />
      )}

      {/* Promise band */}
      <section className="g-light-a py-16">
        <div className="container-wide grid gap-6 md:grid-cols-3">
          {meta.promise.map((p, i) => (
            <FadeUp key={p.t} delay={i * 0.08}>
              <div className="flex items-start gap-4 rounded-2xl border border-forest/10 bg-white p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-soft text-forest-accent">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={PROMISE_ICON[p.icon] ?? PROMISE_ICON.leaf} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-forest-ink">{p.t}</h3>
                  <p className="mt-1 text-sm text-forest-ink/65">{p.d}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {meta.comingSoon && (
        <section className="container-wide pb-20 text-center">
          <p className="text-forest-ink/60">This world is arriving soon. Meanwhile,</p>
          <Link href="/plants" className="btn-cta mt-4 inline-flex px-7 py-3">Explore plants</Link>
        </section>
      )}
    </>
  );
}
