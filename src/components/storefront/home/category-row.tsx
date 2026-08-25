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
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1c4d28,#0f2d1a)] text-white/50">
        {fallback}
      </div>
    );
  }
  return (
    // Catalog shots are white-background JPEGs; object-contain over the white
    // card lets the image's own white bg merge seamlessly, so the plant reads
    // as a cutout (no crop). Relies on category images being white-bg product
    // shots — a lifestyle photo would letterbox on white instead.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setErr(true)}
      className="h-full w-full object-contain p-1 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
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
    <section className="relative z-[5]">
      <div className="mx-auto max-w-none px-5 sm:px-8 lg:px-16">
        {/* white panel the cards sit on (per reference) */}
        <div className="relative rounded-[20px] bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div
            ref={railRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pr-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {isLoading && categories.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[88px] min-w-[210px] flex-none animate-pulse rounded-2xl bg-black/[0.05]" />
                ))
              : categories.map((c: any, i: number) => {
                  const img = c.image?.original ?? c.image?.thumbnail ?? '';
                  return (
                    <motion.div
                      key={c.id ?? c.slug}
                      className="min-w-[210px] max-w-[230px] flex-none"
                      initial={{ y: 20 }}
                      whileInView={{ y: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ duration: 0.5, delay: (i % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={`/c/${c.slug}`}
                        className="group flex h-full items-center gap-3.5 rounded-2xl border border-[#eee] bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e0e0e0] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                      >
                        {/* product photo — left, 56×56 */}
                        <div className="h-14 w-14 shrink-0 overflow-hidden">
                          <Thumb src={img} fallback={FALLBACK_ICONS[i % FALLBACK_ICONS.length]} />
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          <h4 className="line-clamp-2 text-[0.95rem] font-semibold leading-tight text-[#1a2e1f]">{c.name}</h4>
                          <span className="inline-flex items-center gap-1 text-[0.85rem] font-medium text-[#2e7d32]">
                            Shop Now
                            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
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
            className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[#eee] bg-white text-[#1a2e1f] shadow-[0_2px_10px_rgba(0,0,0,0.1)] transition-colors hover:text-[#2e7d32] md:grid"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

export default CategoryRow;
