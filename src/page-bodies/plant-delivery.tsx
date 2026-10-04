'use client';

import Link from 'next/link';
import { MapPin } from '@/components/ui/icon';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';
import Breadcrumb from '@/components/ui/breadcrumb';
import PlantAtHomeCard from '@/components/products/cards/plantathome';
import { POPULAR_PLANT_CATEGORIES } from '@/components/storefront/verticals';
import type { LocationPageSummary } from '@/framework/ssr/location-pages';

const SHOP_LINKS = [
  { label: 'All Plants', href: '/plants' },
  ...POPULAR_PLANT_CATEGORIES,
  { label: 'Pots & Planters', href: '/pots-planters' },
];

// Only what the store actually does — availability is checked per address,
// timelines show at checkout. No same-day or ETA promises here.
const STEPS = [
  {
    title: 'Pick your city',
    body: 'Plants and prices depend on where you are. Choose your city and we show only what can reach you.',
  },
  {
    title: 'Choose your plants',
    body: 'Browse indoor, outdoor, flowering and air-purifying plants, plus pots and gardening essentials.',
  },
  {
    title: 'Check out',
    body: 'Enter your address and the delivery options and timelines for it appear before you pay.',
  },
  {
    title: 'Delivered to your door',
    body: 'Every plant is inspected before dispatch and packed to travel safely. Follow your order on the tracking page.',
  },
];

/**
 * /plant-delivery — the commercial landing page and the city hub. Everything
 * is server-rendered props (no client fetch): the links must be in the HTML.
 */
function PlantDeliveryPage({
  cities,
  products,
}: {
  cities: LocationPageSummary[];
  products: any[];
}) {
  const byState = cities.reduce<Record<string, LocationPageSummary[]>>((acc, c) => {
    (acc[c.state_name ?? 'Other'] ??= []).push(c);
    return acc;
  }, {});

  return (
    <section className="mx-auto w-full max-w-1920 pb-16 g-light-a">
      <div className="mx-auto w-full max-w-screen-xl px-5 py-10">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Plant Delivery' }]}
          className="mb-6"
        />
        <h1 className="text-3xl font-semibold text-heading md:text-4xl">
          Plant Delivery Online Across India
        </h1>
        <p className="mt-3 max-w-2xl text-base text-body">
          Buy plants online from PlantAtHome and get them delivered to your doorstep. We work with
          local nurseries, so what you see is what can actually reach your address — healthy,
          hand-checked plants, pots and gardening essentials.
        </p>

        {/* Shop by category — internal links */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          {SHOP_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-border-200 bg-white px-4 py-2 text-sm font-medium text-heading transition-colors hover:border-accent hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {products.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-xl font-semibold text-heading">Popular Plants</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product: any) => (
                <PlantAtHomeCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-14">
          <h2 className="mb-5 text-xl font-semibold text-heading">How Plant Delivery Works</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-kraft-200 bg-white p-5 shadow-box">
                <span className="text-sm font-semibold text-accent">Step {i + 1}</span>
                <h3 className="mt-1 text-base font-semibold text-heading">{s.title}</h3>
                <p className="mt-2 text-sm text-body">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-body">
            Already ordered?{' '}
            <Link href="/track-order" className="text-accent hover:underline">
              Track your order
            </Link>
            .
          </p>
        </div>

        <div className="mt-14">
          <h2 className="mb-2 text-xl font-semibold text-heading">Cities We Deliver To</h2>
          {cities.length === 0 ? (
            <p className="text-body">
              City pages are on their way — meanwhile, browse the full{' '}
              <Link href="/plants" className="text-accent hover:underline">
                plant collection
              </Link>{' '}
              and pick your city to see what delivers to you.
            </p>
          ) : (
            <div className="mt-5 space-y-8">
              {Object.entries(byState)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([state, rows]) => (
                  <div key={state}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-body">
                      {state}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {rows.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/plants-in/${c.slug}`}
                          className="flex items-center gap-3 rounded-lg border border-border-200 bg-white p-4 transition-colors hover:border-accent hover:text-accent"
                        >
                          <MapPin className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                          <span className="font-medium">Plant delivery in {c.city_name}</span>
                          {c.products_count ? (
                            <span className="ml-auto text-sm text-body">{c.products_count} items</span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="mt-14 rounded-2xl border border-kraft-200 bg-white p-6 shadow-box md:p-8">
          <h2 className="mb-2 text-xl font-semibold text-heading">Plant Care After Delivery</h2>
          <p className="text-body">
            A new plant needs a few days to settle in. If a leaf yellows or something looks off,
            upload a photo to{' '}
            <Link href="/plant-doctor" className="text-accent hover:underline">
              Plant Doctor
            </Link>{' '}
            for a diagnosis, or visit our{' '}
            <Link href="/help" className="text-accent hover:underline">
              help centre
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody(props: { cities: LocationPageSummary[]; products: any[] }) {
  return getLayoutWithFooter(<PlantDeliveryPage {...props} />);
}
