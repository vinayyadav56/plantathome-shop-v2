import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import {
  loadCityProducts,
  loadLocationPage,
  loadLocationPages,
  loadTopCategories,
} from '@/framework/ssr/location-pages';
import { SITE_URL } from '@/lib/site-url';
import { PageBody } from '@/page-bodies/plants-in-city';

export const revalidate = 300;

type Params = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city } = await params;
  const page = await loadLocationPage(city);
  // 404/redirect HERE, not just in the page body: app/loading.tsx makes Next
  // flush a 200 + loader shell before the page component runs, so notFound()
  // thrown there only downgrades to a streamed soft-404 (and the 308 becomes
  // a soft client redirect). Metadata resolves before the shell flush — same
  // rationale as the [searchType] vertical guard.
  if (!page) notFound();
  if (page.slug !== city) permanentRedirect(`/plants-in/${page.slug}`);

  const title = page.seo_title || `Buy Plants Online in ${page.city_name} | Plant Delivery | PlantAtHome`;
  const description =
    page.seo_description ||
    `Order healthy indoor and outdoor plants, pots and gardening essentials online in ${page.city_name}. Hand-checked plants with doorstep delivery from PlantAtHome.`;
  const url = `${SITE_URL}/plants-in/${page.slug}`;

  return {
    // Admin titles are complete titles — bypass the "| PlantAtHome" template.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary_large_image', title, description },
    ...(page.is_indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function Page({ params }: Params) {
  const { city } = await params;
  const page = await loadLocationPage(city);
  if (!page) notFound();
  // Alias slug (gurgaon, new-delhi…) — one canonical URL per city.
  if (page.slug !== city) permanentRedirect(`/plants-in/${page.slug}`);

  const [{ dehydratedState }, products, categories, allCities] = await Promise.all([
    loadGeneralData(),
    loadCityProducts(page.city_name),
    loadTopCategories(),
    loadLocationPages(),
  ]);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Plant Delivery Cities', item: `${SITE_URL}/plants-in` },
      { '@type': 'ListItem', position: 3, name: page.city_name, item: `${SITE_URL}/plants-in/${page.slug}` },
    ],
  };
  const faqJsonLd =
    page.faqs && page.faqs.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: page.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null;

  return (
    <Hydrate state={dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <PageBody
        page={page}
        products={products}
        categories={categories}
        otherCities={allCities.filter((c) => c.slug !== page.slug)}
      />
    </Hydrate>
  );
}
