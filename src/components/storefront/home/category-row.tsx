'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCategories } from '@/framework/category';
import { useHomeConfig, applyCuration } from '@/lib/use-home-config';
import { ArrowRight, Droplet, Flower2, ShoppingBag, Sprout, Wrench } from '@/components/ui/icon';

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
  // Six slots, not five: the row was shrunk (annotation) specifically to make
  // room for another vertical's card. Which six is admin curation's call.
  const categories = applyCuration(raw ?? [], homeCategories).slice(0, 6);

  return (
    <section className="relative z-[5]">
      <div className="mx-auto max-w-none px-5 sm:px-8 lg:px-16">
        <div className="pah-rail [--rail-w:46%] md:[--rail-w:calc((100%_-_40px)/6)] lg:[--rail-w:calc((100%_-_60px)/6)] grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">

          {isLoading && categories.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[76px] animate-pulse rounded-[14px] bg-white/60" />
              ))
            : categories.map((c: any, i: number) => {
                const img = c.image?.original ?? c.image?.thumbnail ?? '';
                return (
                  <motion.div
                    key={c.id ?? c.slug}
                    initial={{ y: 20 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.5, delay: (i % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/c/${c.slug}`}
                      className="group flex h-[76px] overflow-hidden rounded-[14px] border border-kraft-200 bg-white shadow-[0_6px_18px_rgba(5,16,8,0.14)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_14px_32px_rgba(5,16,8,0.2)] md:h-[68px] lg:h-[76px]"
                    >
                      {/* text — left */}
                      <div className="flex min-w-0 flex-1 flex-col justify-center p-2.5 md:p-2 lg:p-2.5">
                        <p className="line-clamp-2 font-hanken text-[13px] font-bold leading-tight text-forest-900 md:text-[11px] lg:text-[13px]">
                          {c.name}
                        </p>
                        <p className="mt-1 flex items-center gap-1 font-hanken text-[11px] font-semibold leading-none text-forest-900 transition-colors duration-200 group-hover:text-forest-700 md:text-[9.5px] lg:text-[11px]">
                          Shop Now
                          <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                        </p>
                      </div>

                      {/* product photo — right */}
                      <div className="h-full w-[38%] shrink-0 overflow-hidden rounded-r-[14px]">
                        <Thumb src={img} fallback={FALLBACK_ICONS[i % FALLBACK_ICONS.length]} />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
        </div>
      </div>
    </section>
  );
}

export default CategoryRow;
