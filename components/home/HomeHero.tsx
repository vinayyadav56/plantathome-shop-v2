'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { KenBurns, WordReveal, FadeUp } from '@/components/motion';
import { listBanners } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { HOME_SCENES, TRUST_ITEMS } from '@/lib/verticals';
import { useSession } from '@/lib/store/session';

export function HomeHero() {
  const city = useSession((s) => s.city);
  const { data: banners } = useQuery({
    queryKey: qk.banners('home', city),
    queryFn: () => listBanners('home', city),
    staleTime: 5 * 60_000,
  });

  const images = (banners && banners.length ? banners.map((b) => b.image_url) : HOME_SCENES).filter(Boolean);
  const headline = banners?.[0]?.title ?? 'Bring the wild indoors.';

  return (
    <section className="relative flex min-h-[86vh] items-center overflow-hidden">
      <KenBurns images={images} interval={6} />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-ink/90 via-forest-ink/45 to-forest-ink/30" />

      <div className="container-wide relative z-10 py-24 text-cream">
        <FadeUp>
          <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-cream/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cta" /> India’s plant company
          </span>
        </FadeUp>

        <h1 className="mt-6 max-w-4xl font-pahserif text-[clamp(2.8rem,1.8rem+5vw,5.5rem)] font-semibold leading-[1.02]">
          <WordReveal text={headline} />
        </h1>

        <FadeUp delay={0.2}>
          <p className="mt-5 max-w-xl text-lg text-cream/85">
            Rare foliage, premium tools & farm-fresh produce — hand-picked by botanists and delivered thriving from
            nurseries near you.
          </p>
        </FadeUp>

        <FadeUp delay={0.35}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/plants" className="btn-cta px-7 py-3.5 text-base">Shop plants</Link>
            <Link href="/products" className="rounded-pill border border-cream/40 px-7 py-3.5 text-base font-medium text-cream transition hover:bg-cream/10">
              Explore all worlds
            </Link>
          </div>
        </FadeUp>

        <FadeUp delay={0.5}>
          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-sm text-cream/80">
            {TRUST_ITEMS.slice(0, 3).map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-cta"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </li>
            ))}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
}
