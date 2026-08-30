import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import PolicyPage, { type PublicPolicy } from '@/page-bodies/policy-page';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';

export const revalidate = 300;

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in').replace(/\/$/, '');
const API = (process.env.NEXT_PUBLIC_REST_API_ENDPOINT || '').replace(/\/$/, '');

/**
 * Governed public policies. The API only ever returns PUBLISHED documents with
 * visibility=public, so an unpublished or internal slug 404s here rather than
 * leaking a draft.
 */
async function fetchPolicy(slug: string): Promise<PublicPolicy | null> {
  if (!API) return null;
  try {
    const res = await fetch(`${API}/legal/public/policies/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicPolicy;
  } catch {
    // A policy page must not 500 because the API blipped — the caller 404s.
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const policy = await fetchPolicy(params.slug);
  const title = policy?.title ?? 'Policy';
  const url = `${BASE}/policies/${params.slug}`;

  return {
    title: `${title} | PlantAtHome`,
    description: policy
      ? `${title} for PlantAtHome, operated by Silvestrix Green LLP.${policy.updated_at ? ` Last updated ${policy.updated_at}.` : ''}`
      : undefined,
    alternates: { canonical: url },
    openGraph: { title, url, type: 'article' },
    robots: policy ? undefined : { index: false },
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const [policy, { dehydratedState }] = await Promise.all([
    fetchPolicy(params.slug),
    loadGeneralData(),
  ]);
  if (!policy) notFound();

  return (
    <Hydrate state={dehydratedState}>
      {getLayoutWithFooter(<PolicyPage policy={policy} />)}
    </Hydrate>
  );
}
