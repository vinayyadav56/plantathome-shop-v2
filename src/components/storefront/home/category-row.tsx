'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCategories } from '@/framework/category';
import { useHomeConfig, applyCuration } from '@/lib/use-home-config';

// Same query as collections.tsx (shared react-query cache). limit=1000 makes the
// categories API truncate its JSON mid-stream — see collections.tsx.
const HOME_CATEGORIES_LIMIT = 100;

const FALLBACK_ICONS: JSX.Element[] = [
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M5 9h14l-1.5 10.5a2 2 0 0 1-2 1.5H8.5a2 2 0 0 1-2-1.5L5 9Z" /><path d="M4 9h16" /><path d="M9 6c0-1.5 1.5-3 3-3s3 1.5 3 3" /></svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 22V12" /><path d="M12 12c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z" /><path d="M12 14c0-2.8-2.2-5-5-5 0 2.8 2.2 5 5 5Z" /></svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 22a7 7 0 0 0 7-7c0-4-7-12-7-12S5 11 5 15a7 7 0 0 0 7 7Z" /></svg>,
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6 2 2 6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" /></svg>,
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setErr(true)}
      className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
    />
  );
}

export function CategoryRow() {
  const { categories: raw, isLoading } = useCategories({ limit: HOME_CATEGORIES_LIMIT, parent: 'null' } as any);
  const { homeCategories } = useHomeConfig();
  const categories = applyCuration(raw ?? [], homeCategories).slice(0, 5);

  return (
    <section className="relative z-[5]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-16">
        <div className="pah-rail [--rail-w:46%] md:[--rail-w:calc((100%_-_40px)/5)] lg:[--rail-w:calc((100%_-_48px)/5)] grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">

          {isLoading && categories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[150px] animate-pulse rounded-[14px] bg-white/60" />
              ))
            : categories.map((c: any, i: number) => {
                const img = c.image?.original ?? c.image?.thumbnail ?? '';
                return (
                  <motion.div
                    key={c.id ?? c.slug}
                    initial={{ y: 20 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.5, delay: (i % 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/c/${c.slug}`}
                      className="group flex h-[150px] overflow-hidden rounded-[14px] border border-kraft-200 bg-white shadow-[0_6px_18px_rgba(5,16,8,0.14)] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_14px_32px_rgba(5,16,8,0.2)] md:h-[92px] lg:h-[150px]"
                    >
                      {/* text — left */}
                      <div className="flex min-w-0 flex-1 flex-col justify-center p-3.5 md:p-2.5 lg:p-3.5">
                        <p className="line-clamp-2 font-hanken text-[15px] font-bold leading-snug text-forest-900 md:text-[11.5px] lg:text-[15px]">
                          {c.name}
                        </p>
                        <p className="mt-1 line-clamp-2 font-hanken text-[11.5px] leading-snug text-stone-500 md:hidden lg:line-clamp-2">
                          {c.description || c.details || 'Explore collection'}
                        </p>
                        <p className="mt-2 flex items-center gap-1 font-hanken text-[12px] font-semibold text-forest-900 transition-colors duration-200 group-hover:text-forest-700 md:mt-1 md:text-[10px] lg:mt-2 lg:text-[12px]">
                          Shop Now
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-[10px] w-[10px] transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
                            <path d="M5 12h13M13 6l6 6-6 6" />
                          </svg>
                        </p>
                      </div>

                      {/* product photo — right */}
                      <div className="h-full w-[42%] shrink-0 overflow-hidden rounded-r-[14px]">
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
