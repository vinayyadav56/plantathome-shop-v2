'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Truck } from 'lucide-react';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';
import Breadcrumb from '@/components/ui/breadcrumb';
import Accordion from '@/components/ui/accordion';
import PlantAtHomeCard from '@/components/products/cards/plantathome';
import Button from '@/components/ui/button';
import { sanitizeContent } from '@/lib/sanitize-content';
import { setStoredCity } from '@/lib/customer-location';
import { track } from '@/lib/analytics/track';
import type { LocationPageData, LocationPageSummary } from '@/framework/ssr/location-pages';

/**
 * /plants-in/{city} — the city landing page. Everything renders from
 * server-fetched props: the city in the URL is the source of truth, never the
 * visitor's stored shopping city (a Delhi shopper reading the Mumbai page must
 * see Mumbai's products). "Shop plants in {city}" is the explicit-choice
 * bridge into the normal city-scoped store.
 */
function PlantsInCityPage({
  page,
  products,
  categories,
  otherCities,
}: {
  page: LocationPageData;
  products: any[];
  categories: any[];
  otherCities: LocationPageSummary[];
}) {
  const router = useRouter();
  const shopHere = () => {
    setStoredCity(page.city_name);
    track('city_changed', { label: page.city_name, meta: { source: 'landing_page' } });
    router.push('/plants');
  };

  return (
    <section className="mx-auto w-full max-w-1920 pb-16 g-light-a">
      <div className="mx-auto w-full max-w-screen-xl px-5 py-10">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Plant Delivery Cities', href: '/plants-in' },
            { label: page.city_name },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="max-w-3xl">
          <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
            <MapPin className="h-4 w-4" aria-hidden />
            {page.city_name}
            {page.state_name ? `, ${page.state_name}` : ''}
          </p>
          <h1 className="text-3xl font-semibold text-heading md:text-4xl">
            Buy Plants Online in {page.city_name}
          </h1>
          {page.intro_html ? (
            <div
              className="prose prose-sm mt-4 max-w-none text-body"
              dangerouslySetInnerHTML={{ __html: sanitizeContent(page.intro_html) }}
            />
          ) : (
            <p className="mt-4 text-base text-body">
              Healthy indoor and outdoor plants, premium pots and gardening essentials — hand-checked
              and delivered to your doorstep in {page.city_name}.
            </p>
          )}
          <Button onClick={shopHere} className="mt-6">
            Shop plants in {page.city_name}
          </Button>
        </div>

        {/* Categories — internal links */}
        {categories.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-xl font-semibold text-heading">
              Popular Plant Categories in {page.city_name}
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c: any) => (
                <Link
                  key={c.slug}
                  href={`/c/${c.slug}`}
                  className="rounded-full border border-border-200 bg-white px-4 py-2 text-sm font-medium text-heading transition-colors hover:border-accent hover:text-accent"
                >
                  {c.name}
                </Link>
              ))}
              <Link
                href="/categories"
                className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
              >
                All categories →
              </Link>
            </div>
          </div>
        )}

        {/* Live products in this city */}
        {products.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-xl font-semibold text-heading">
              Plants Available in {page.city_name}
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product: any) => (
                <PlantAtHomeCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Delivery information */}
        <div className="mt-14 rounded-xl border border-border-200 bg-white p-6 md:p-8">
          <h2 className="mb-3 inline-flex items-center gap-2 text-xl font-semibold text-heading">
            <Truck className="h-5 w-5 text-accent" aria-hidden />
            Plant Delivery in {page.city_name}
          </h2>
          {page.delivery_html ? (
            <div
              className="prose prose-sm max-w-none text-body"
              dangerouslySetInnerHTML={{ __html: sanitizeContent(page.delivery_html) }}
            />
          ) : (
            <p className="text-body">
              We deliver across {page.city_name} — every plant is inspected before dispatch and
              packed to travel safely. Delivery options and timelines show at checkout for your
              exact address.
            </p>
          )}
        </div>

        {/* FAQs */}
        {page.faqs && page.faqs.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-xl font-semibold text-heading">
              Frequently Asked Questions — {page.city_name}
            </h2>
            <Accordion
              items={page.faqs.map((f) => ({ title: f.question, content: f.answer }))}
              translatorNS="faq"
            />
          </div>
        )}

        {/* Other cities — internal links */}
        {otherCities.length > 0 && (
          <div className="mt-14 border-t border-border-200 pt-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-body">
              We also deliver plants in
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {otherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/plants-in/${c.slug}`}
                  className="text-sm text-body transition-colors hover:text-accent hover:underline"
                >
                  Plants in {c.city_name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── App Router body wrapper (V1 _app.tsx getLayout semantics) ── */
export function PageBody(props: {
  page: LocationPageData;
  products: any[];
  categories: any[];
  otherCities: LocationPageSummary[];
}) {
  return getLayoutWithFooter(<PlantsInCityPage {...props} />);
}
