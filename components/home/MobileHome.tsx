'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { KenBurns } from '@/components/motion';
import { ProductCard, ProductCardSkeleton } from '@/components/products/ProductCard';
import { useVerticals } from '@/lib/hooks/useVerticals';
import { useBrowseCards } from '@/lib/hooks/useProductCards';
import { listBanners } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { HOME_SCENES } from '@/lib/verticals';
import { useSession } from '@/lib/store/session';

export function MobileHome() {
  const city = useSession((s) => s.city);
  const { verticals } = useVerticals();
  const plants = verticals.find((v) => v.key === 'plants')?.categoryUuids ?? [];
  const { cards, isLoading } = useBrowseCards({ categoryUuids: plants, limit: 6 });
  const { data: banners } = useQuery({ queryKey: qk.banners('home', city), queryFn: () => listBanners('home', city), staleTime: 300_000 });
  const images = (banners?.length ? banners.map((b) => b.image_url) : HOME_SCENES).filter(Boolean);

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative flex h-[70vh] items-end overflow-hidden">
        <KenBurns images={images} interval={6} />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-ink/90 via-forest-ink/30 to-transparent" />
        <div className="relative z-10 p-6 text-cream">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/25 bg-cream/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cta" /> Plant company
          </span>
          <h1 className="mt-3 font-pahserif text-4xl font-semibold leading-tight">Bring the wild indoors.</h1>
          <p className="mt-2 text-sm text-cream/85">Hand-picked plants, delivered thriving.</p>
          <Link href="/plants" className="btn-cta mt-4 inline-flex px-6 py-3">Shop plants</Link>
        </div>
      </section>

      {/* Category circles */}
      <section className="px-4 py-6">
        <div className="pah-rail gap-4" style={{ ['--rail-w' as string]: '25%' }}>
          {verticals.map((v) => (
            <Link key={v.key} href={v.path} className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-forest/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.scenes[0]} alt={v.label} className="h-full w-full object-cover" />
              </div>
              <span className="text-center text-[11px] font-medium text-forest-ink">{v.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Offer strip */}
      <section className="px-4 pb-6">
        <Link href="/offers" className="g-footer flex items-center justify-between rounded-2xl p-5 text-cream">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cta">Limited time</p>
            <p className="font-pahserif text-2xl font-semibold">Up to 40% off</p>
          </div>
          <span className="rounded-full bg-cta px-4 py-2 text-xs font-bold text-cta-ink">Shop sale</span>
        </Link>
      </section>

      {/* Best sellers */}
      <section className="px-4 py-4">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-pahserif text-2xl font-semibold text-forest-ink">Best sellers</h2>
          <Link href="/plants" className="text-sm font-semibold text-forest-accent">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />) : cards.map((c) => <ProductCard key={c.uuid} card={c} />)}
        </div>
      </section>

      {/* Worlds */}
      <section className="px-4 py-6">
        <h2 className="mb-4 font-pahserif text-2xl font-semibold text-forest-ink">Our worlds</h2>
        <div className="grid grid-cols-2 gap-3">
          {verticals.slice(0, 4).map((v) => (
            <Link key={v.key} href={v.path} className="relative flex h-32 items-end overflow-hidden rounded-2xl p-3 text-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.scenes[0]} alt={v.label} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-ink/85 to-transparent" />
              <span className="relative z-10 font-pahserif text-xl font-semibold">{v.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
