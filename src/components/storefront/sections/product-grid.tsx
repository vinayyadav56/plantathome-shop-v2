import Link from 'next/link';
import { Icon } from '../icons';
import { FadeUp, WordReveal } from '../motion';
import { StorefrontProductCard } from '../product-card';
import type { Product } from '@/types';

export function ProductGrid({
  products,
  typeSlug,
  isLoading,
  eyebrow,
  title,
  viewAllTo,
  viewAllLabel,
  tint,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: {
  products: Product[];
  typeSlug: string;
  isLoading?: boolean;
  eyebrow: string;
  title: string;
  viewAllTo?: string;
  viewAllLabel?: string;
  tint?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}) {
  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section id="products" className={tint ? 'bg-cream-100' : ''}>
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <FadeUp>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.25em] text-gold">
                {eyebrow}
              </p>
            </FadeUp>
            <h2 className="max-w-xl font-cormorant text-4xl font-bold not-italic leading-tight text-forest-900 sm:text-5xl">
              <WordReveal text={title} />
            </h2>
          </div>
          {viewAllTo && (
            <FadeUp delay={0.1}>
              <Link
                href={viewAllTo}
                className="group inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-md border border-forest-700 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-forest-800 transition hover:bg-sage-100"
              >
                {viewAllLabel ?? 'View all'}
                <Icon.arrow className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </FadeUp>
          )}
        </div>

        <div className="pah-rail [--rail-w:46%] sm:[--rail-w:42%] lg:[--rail-w:calc((100%_-_60px)/4)] grid grid-cols-2 gap-3.5 sm:gap-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-sage-200" />
              ))
            : products.map((p, i) => (
                <FadeUp key={p.id ?? p.slug} delay={(i % 4) * 0.05}>
                  <StorefrontProductCard product={p} />
                </FadeUp>
              ))}
        </div>

        {hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-ds-btn px-7 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:bg-ds-btn-hover disabled:opacity-60 sm:w-auto"
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
