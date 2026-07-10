import Link from 'next/link';
import { ProductGrid } from '@/components/products/ProductGrid';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-forest-soft/60 to-cream">
        <div className="container-wrap grid gap-8 py-16 sm:py-24 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-forest-accent">
              Bring nature home
            </p>
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] text-forest-ink sm:text-6xl">
              Plants, pots &amp; care —<br />
              delivered from nurseries near you.
            </h1>
            <p className="max-w-md text-lg text-forest-ink/70">
              Pick your city and we&apos;ll show what a local nursery can plant, pot and deliver to your door.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-cta">
                Shop plants
              </Link>
              <Link href="/products?category=indoor" className="btn-outline">
                Indoor favourites
              </Link>
            </div>
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-card bg-gradient-to-br from-forest/90 to-forest-accent md:block">
            <div className="absolute inset-0 flex items-center justify-center text-cream/90">
              <svg width="140" height="140" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 21c0-6 3.4-10.2 8.5-12-.4 6-4.2 10.3-8.5 12Zm0 0c0-5-3-8.8-7.5-10.2C4.8 16.7 8.3 19.3 12 21Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-wrap py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-3xl font-semibold text-forest-ink">Fresh from the nursery</h2>
            <p className="text-forest-ink/60">Handpicked plants ready to ship.</p>
          </div>
          <Link href="/products" className="text-sm font-medium text-forest-accent hover:text-forest">
            View all →
          </Link>
        </div>
        <ProductGrid limit={8} />
      </section>
    </div>
  );
}
