'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCategories } from '@/framework/category';
import { useHomeConfig, applyCuration } from '@/lib/use-home-config';
import { ArrowRight, ChevronRight, Droplet, Flower2, ShoppingBag, Sprout, Wrench } from '@/components/ui/icon';

// Same query as collections.tsx (shared react-query cache). limit=1000 makes the
// categories API truncate its JSON mid-stream — see collections.tsx.
const HOME_CATEGORIES_LIMIT = 100;

const FALLBACK_ICONS: JSX.Element[] = [
  <Flower2 key="0" size={24} aria-hidden />,
  <ShoppingBag key="1" size={24} aria-hidden />,
  <Sprout key="2" size={24} aria-hidden />,
  <Droplet key="3" size={24} aria-hidden />,
  <Wrench key="4" size={24} aria-hidden />,
];

function Thumb({ src, fallback }: { src: string; fallback: JSX.Element }) {
  const [err, setErr] = React.useState(false);
  if (err || !src) {
    // Neutral radial tile matching the image tiles — a dark tile would clash
    // inside the light glass panel.
    return (
      <div className="flex h-full w-full items-center justify-center text-[#39772b]/60">
        {fallback}
      </div>
    );
  }
  return (
    // Catalog shots are white-background JPEGs; object-contain over the soft
    // radial tile lets the image's own white bg blend in, so the plant reads
    // as a cutout (no crop).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setErr(true)}
      className="h-full w-full object-contain p-[5px] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
    />
  );
}

export function CategoryRow() {
  const { categories: raw, isLoading } = useCategories({ limit: HOME_CATEGORIES_LIMIT, parent: 'null' } as any);
  const { homeCategories } = useHomeConfig();
  // Twelve slots feeding a scrollable rail (six visible, the rest behind the
  // arrow). Which twelve — and their order — is admin curation's call.
  const categories = applyCuration(raw ?? [], homeCategories).slice(0, 12);
  const railRef = React.useRef<HTMLDivElement>(null);

  return (
    <section className="relative">
      {/* warm-glass panel the cards float on (design spec §8) */}
      <div className="relative rounded-[22px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.93),rgba(248,248,243,0.86))] p-3 shadow-[0_22px_60px_rgba(6,25,11,0.18),0_3px_10px_rgba(6,25,11,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[24px] backdrop-saturate-[1.3]">
        <div
          ref={railRef}
          // py-1 gives the 3px hover lift headroom INSIDE the scroll box —
          // Chrome counts transformed boxes in scrollable overflow, so without
          // it the rail gains a 3px vertical scroll; overflow-y-hidden is the
          // backstop (annotation: "no top-bottom scroll in this section").
          className="flex gap-2.5 overflow-x-auto overflow-y-hidden scroll-smooth py-1 pr-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading && categories.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[80px] min-w-[210px] flex-none animate-pulse rounded-2xl bg-black/[0.05]" />
              ))
            : categories.map((c: any, i: number) => {
                const img = c.image?.original ?? c.image?.thumbnail ?? '';
                return (
                  <motion.div
                    key={c.id ?? c.slug}
                    className="min-w-[210px] flex-[1_0_210px]"
                    initial={{ y: 20 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.5, delay: (i % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/c/${c.slug}`}
                      className="group flex h-[80px] items-center rounded-2xl border border-[rgba(30,65,36,0.06)] bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(245,247,241,0.45))] p-2.5 transition-all duration-200 hover:-translate-y-[3px] hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(243,248,238,0.85))] hover:shadow-[0_10px_25px_rgba(15,55,24,0.1)]"
                    >
                      {/* product photo — left, 56×56 on a soft radial tile */}
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[13px] bg-[radial-gradient(circle_at_50%_30%,#ffffff_0%,#f2f4ed_70%,#e9ede4_100%)]">
                        <Thumb src={img} fallback={FALLBACK_ICONS[i % FALLBACK_ICONS.length]} />
                      </div>
                      <div className="flex min-w-0 flex-col justify-center gap-1.5 pl-3 pr-1">
                        {/* strictly one line, small and light (annotation) */}
                        <h4 className="truncate text-[13px] font-normal leading-[1.3] text-[#1b2b1e]">{c.name}</h4>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-[#39772b]">
                          Shop Now
                          <ArrowRight size={14} className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
        </div>

        {/* rail scroller — touch scrolls natively below md */}
        <button
          type="button"
          aria-label="Scroll categories"
          onClick={() => railRef.current?.scrollBy({ left: 452, behavior: 'smooth' })}
          className="absolute right-3 top-1/2 z-10 hidden h-[46px] w-[46px] -translate-y-1/2 place-items-center rounded-full border border-[rgba(30,70,38,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(235,241,231,0.9))] text-[#23442b] shadow-[0_6px_18px_rgba(15,45,20,0.12)] transition-all duration-200 hover:scale-[1.06] hover:shadow-[0_10px_25px_rgba(15,45,20,0.18)] md:grid"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
    </section>
  );
}

export default CategoryRow;
