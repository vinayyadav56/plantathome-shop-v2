import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import {
  loadCategoriesIndexData,
  loadComingSoon,
  loadGeneralData,
  loadTypeName,
  loadTypeSlugs,
} from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/categories';
import { PageBody as ComingSoonPageBody } from '@/components/storefront/coming-soon';
import { getVerticalMeta } from '@/components/storefront/verticals';
import { SITE_URL } from '@/lib/site-url';

/**
 * /categories/{type}: ONE vertical's categories — where each vertical's "View All Categories"
 * lands (owner annotation 2026-10-09; /categories still lists every vertical). Built for whatever
 * type slugs the API returns, so production's `farm-box` and staging's `farmbox` each work in
 * their own environment and the other spelling 404s.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs: string[] = await loadTypeSlugs(); // fail-soft → [] (built at runtime instead)
  return slugs.map((type) => ({ type }));
}

async function label(type: string) {
  const name = (await loadTypeName(type)) ?? undefined;
  return getVerticalMeta(type, name).label;
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  // A Coming Soon vertical renders its Coming Soon page (below), kept out of the index.
  const soon = await loadComingSoon(type);
  if (soon) return { title: `${soon.name} — Coming soon`, robots: { index: false } };
  const slugs: string[] = await loadTypeSlugs();
  if (slugs.length && !slugs.includes(type)) notFound();
  const name = await label(type);
  return {
    title: `${name} Categories`,
    description: `Browse every ${name} category at PlantAtHome.`,
    alternates: { canonical: `/categories/${type}` },
  };
}

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const soon = await loadComingSoon(type);
  if (soon) {
    const { dehydratedState } = await loadGeneralData();
    return (
      <Hydrate state={dehydratedState}>
        <ComingSoonPageBody slug={type} {...soon} />
      </Hydrate>
    );
  }
  const slugs: string[] = await loadTypeSlugs();
  if (slugs.length && !slugs.includes(type)) return notFound();
  const name = await label(type);
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories` },
      { '@type': 'ListItem', position: 3, name, item: `${SITE_URL}/categories/${type}` },
    ],
  };
  const { dehydratedState } = await loadCategoriesIndexData(type);
  return (
    <Hydrate state={dehydratedState}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />
      <PageBody type={type} />
    </Hydrate>
  );
}
