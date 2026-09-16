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
  // Reject unknown verticals HERE as well as in the page body, so a garbage
  // slug is never keyword-stuffed into <title>. (The root app/loading.tsx that
  // used to flush a 200 shell before this ran is gone — it made EVERY missing
  // page a soft 404, for Googlebot too — so the body's notFound() is a real
  // 404 again.) Fail-soft: if the types API is down (slugs = []), let the page
  // decide.
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
