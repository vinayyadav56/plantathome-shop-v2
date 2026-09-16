import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/flash-sale-detail';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';


/** `false` = the API answered and no such sale exists (a real 404); `null` =
 *  could not ask (fail-soft: render, the client shows its own empty state). */
async function flashSaleExists(slug: string): Promise<boolean | null> {
  const api = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || '').replace(/\/$/, '');
  if (!api) return null;
  try {
    const res = await fetch(`${api}/flash-sale/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (res.status === 404) return false;
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    // The endpoint answers 200 with an empty payload for unknown slugs.
    return !!(body && typeof body === 'object' && (body.id || body.slug));
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if ((await flashSaleExists(slug)) === false) notFound();
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — Flash Sale`,
    description: `Limited-time plant deals in the ${name} flash sale at PlantAtHome.`,
    alternates: { canonical: `/flash-sales/${slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if ((await flashSaleExists(slug)) === false) notFound();
  const { dehydratedState } = await loadGeneralData();
  return (
    <Hydrate state={dehydratedState}>
      <PageBody />
    </Hydrate>
  );
}
