import { useProducts } from '@/framework/product';
import { StorefrontProductCard } from '@/components/storefront/product-card';
import { Icon } from '@/components/storefront/icons';

const TRUST = [
  {
    icon: Icon.lock,
    t: 'Secure payment',
    d: 'Encrypted checkout, protected by Razorpay.',
  },
  {
    icon: Icon.shield,
    t: '30-day guarantee',
    d: 'Free replacement if it doesn’t thrive.',
  },
  {
    icon: Icon.spark,
    t: 'Lifetime care support',
    d: 'Our botanists are always a message away.',
  },
];

/** Premium content under the checkout form: trust strip + real product picks. */
export function CheckoutRecommendations() {
  const { products, isLoading } = useProducts({ type: 'plants', limit: 4 });

  return (
    <section className="m-auto w-full max-w-5xl pt-12">
      {/* trust strip */}
      <div className="grid gap-4 rounded-[1.4rem] bg-mintsoft p-5 sm:grid-cols-3 sm:p-6">
        {TRUST.map((b) => (
          <div key={b.t} className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-forest shadow-sm">
              <b.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-bold text-forest">{b.t}</h3>
              <p className="mt-0.5 text-xs leading-5 text-[#5e6d61]">{b.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* recommendations */}
      {(isLoading || products.length > 0) && (
        <div className="mt-12">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.25em] text-gold">
            Add a little extra
          </p>
          <h2 className="font-heading text-2xl font-extrabold text-forest sm:text-3xl">
            You may also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] animate-pulse rounded-2xl bg-mint"
                  />
                ))
              : products
                  .slice(0, 4)
                  .map((p) => (
                    <StorefrontProductCard key={p.id ?? p.slug} product={p} />
                  ))}
          </div>
        </div>
      )}
    </section>
  );
}
