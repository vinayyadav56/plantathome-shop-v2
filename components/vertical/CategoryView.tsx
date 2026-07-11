'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useMemo } from 'react';
import { FadeUp } from '@/components/motion';
import { ProductCard, ProductCardSkeleton } from '@/components/products/ProductCard';
import { useCategoryTree, type CatNode } from '@/lib/hooks/useCategoryTree';
import { useBrowseCards } from '@/lib/hooks/useProductCards';

function subtree(node: CatNode): string[] {
  const out = [node.uuid];
  for (const c of node.children) out.push(...subtree(c));
  return out;
}

export function CategoryView({ slug }: { slug: string }) {
  const { bySlug, isLoading: catsLoading } = useCategoryTree();
  const node = bySlug.get(slug);
  const uuids = useMemo(() => (node ? subtree(node) : []), [node]);
  const { cards, isLoading } = useBrowseCards({ categoryUuids: node ? uuids : [], limit: 48 });

  if (!catsLoading && !node) return notFound();

  return (
    <>
      {/* Banner hero */}
      <section className="relative overflow-hidden bg-forest-ink py-16 text-cream">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(181,142,57,.4), transparent 50%)' }} />
        <div className="container-wide relative z-10">
          <FadeUp>
            <nav className="mb-3 flex items-center gap-2 text-sm text-cream/70">
              <Link href="/" className="hover:text-cream">Home</Link>
              <span>/</span>
              <Link href="/categories" className="hover:text-cream">Categories</Link>
              <span>/</span>
              <span className="text-cream">{node?.name ?? slug}</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Collection</p>
            <h1 className="mt-1 font-pahserif text-[clamp(2.4rem,1.8rem+3vw,4rem)] font-semibold">{node?.name ?? slug}</h1>
          </FadeUp>
          {node && node.children.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {node.children.map((c) => (
                <Link key={c.uuid} href={`/c/${c.slug}`} className="rounded-full border border-cream/25 px-4 py-1.5 text-sm text-cream/85 transition hover:border-cta hover:text-cream">
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Products */}
      <section className="container-wide py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : cards.length === 0 ? (
          <p className="py-16 text-center text-forest-ink/60">Nothing here just yet — check back soon.</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-forest-ink/60">{cards.length} products</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((c) => <ProductCard key={c.uuid} card={c} />)}
            </div>
          </>
        )}
      </section>
    </>
  );
}
