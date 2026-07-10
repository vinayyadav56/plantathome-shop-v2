import Link from 'next/link';
import type { Product } from '@/lib/api/types';

export function ProductCard({ product }: { product: Product }) {
  const img = product.media?.[0]?.url;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(22,48,26,.28)]"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-forest-soft to-cream">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.media?.[0]?.alt ?? product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-forest-accent/40">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 20c0-5 2.8-8.5 7-10-.3 5-3.4 8.5-7 10Zm0 0c0-4.2-2.5-7.3-6.2-8.5C6.1 16 9 19 12 20Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        {product.category?.name && (
          <p className="text-xs font-medium uppercase tracking-wide text-forest-accent">
            {product.category.name}
          </p>
        )}
        <h3 className="font-heading text-lg font-semibold leading-tight text-forest-ink">{product.name}</h3>
        {product.botanical_name && (
          <p className="text-sm italic text-forest-ink/55">{product.botanical_name}</p>
        )}
      </div>
    </Link>
  );
}
