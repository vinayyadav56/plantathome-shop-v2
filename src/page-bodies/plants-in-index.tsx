'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';
import Breadcrumb from '@/components/ui/breadcrumb';
import type { LocationPageSummary } from '@/framework/ssr/location-pages';

/**
 * /plants-in — the city hub. Every active landing page, grouped by state.
 * Server-rendered props (no client fetch): the links must be in the HTML.
 */
function PlantsInIndexPage({ cities }: { cities: LocationPageSummary[] }) {
  const byState = cities.reduce<Record<string, LocationPageSummary[]>>((acc, c) => {
    (acc[c.state_name ?? 'Other'] ??= []).push(c);
    return acc;
  }, {});

  return (
    <section className="mx-auto w-full max-w-1920 pb-16 g-light-a">
      <div className="mx-auto w-full max-w-screen-lg px-5 py-10">
        <Breadcrumb
          items={[{ label: 'Home', href: '/' }, { label: 'Plant Delivery Cities' }]}
          className="mb-6"
        />
        <h1 className="text-3xl font-semibold text-heading md:text-4xl">
          Online Plant Delivery Across India
        </h1>
        <p className="mt-3 max-w-2xl text-base text-body">
          PlantAtHome delivers healthy, hand-checked plants, pots and gardening essentials to your
          doorstep. Choose your city to see live availability, local delivery options and offers.
        </p>

        {cities.length === 0 ? (
          <p className="mt-10 text-body">
            City pages are on their way — meanwhile, browse the full{' '}
            <Link href="/plants" className="text-accent hover:underline">
              plant collection
            </Link>
            .
          </p>
        ) : (
          <div className="mt-10 space-y-10">
            {Object.entries(byState)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([state, rows]) => (
                <div key={state}>
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-body">
                    {state}
                  </h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/plants-in/${c.slug}`}
                        className="flex items-center gap-3 rounded-lg border border-border-200 bg-white p-4 transition-colors hover:border-accent hover:text-accent"
                      >
                        <MapPin className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                        <span className="font-medium">Plants in {c.city_name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody(props: { cities: LocationPageSummary[] }) {
  return getLayoutWithFooter(<PlantsInIndexPage {...props} />);
}
