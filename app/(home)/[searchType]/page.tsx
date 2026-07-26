import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadHomeData, loadTypeSlugs } from '@/framework/ssr/prefetch';
import HomeScreen from '@/app-shell/home-screen';

export const revalidate = 30;
export const dynamicParams = true;

const prettify = (slug: string) => {
  // Params arrive already-decoded from the App Router; a slug containing a
  // literal '%' would make decodeURIComponent THROW (URIError) and turn a
  // harmless bad URL into a 500 instead of a 404.
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    /* keep raw */
  }
  return s
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ searchType: string }>;
}): Promise<Metadata> {
  const { searchType } = await params;
  // Reject unknown verticals HERE, not just in the page body: app/loading.tsx
  // makes Next flush a 200 + loader shell before the page component runs, so a
  // notFound() thrown there can only downgrade to a streamed soft-404. Metadata
  // resolves before the shell flush, so this notFound() still yields a real 404
  // status (and stops the garbage slug from being keyword-stuffed into <title>).
  // Fail-soft: if the types API is down (slugs = []), let the page decide.
  const slugs: string[] = await loadTypeSlugs();
  if (slugs.length && !slugs.includes(searchType)) notFound();
  const name = prettify(searchType);
  return {
    title: `${name} — Shop ${name} Online`,
    description: `Explore the ${name} world at PlantAtHome — hand-checked quality, delivered across 500+ Indian cities.`,
    alternates: { canonical: `/${searchType}` },
  };
}

export async function generateStaticParams() {
  const slugs: string[] = await loadTypeSlugs(); // fail-soft → [] (built at runtime instead)
  return slugs.map((searchType) => ({ searchType }));
}

export default async function VerticalPage({ params }: { params: Promise<{ searchType: string }> }) {
  const { searchType: vertical } = await params;
  const data = await loadHomeData(vertical);
  if (!data) return notFound(); // unknown type slug (V1: notFound + revalidate)
  const { variables, layout, dehydratedState } = data;
  return (
    <Hydrate state={dehydratedState}>
      <HomeScreen variables={variables} layout={layout} />
    </Hydrate>
  );
}
