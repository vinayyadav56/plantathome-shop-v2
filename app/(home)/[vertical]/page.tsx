import { notFound } from 'next/navigation';
import { Hydrate } from '@/compat/react-query-hydration';
import { loadHomeData, loadTypeSlugs } from '@/framework/ssr/prefetch';
import HomeScreen from '@/app-shell/home-screen';

export const revalidate = 30;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs: string[] = await loadTypeSlugs(); // fail-soft → [] (built at runtime instead)
  return slugs.map((vertical) => ({ vertical }));
}

export default async function VerticalPage({ params }: { params: Promise<{ vertical: string }> }) {
  const { vertical } = await params;
  const data = await loadHomeData(vertical);
  if (!data) return notFound(); // unknown type slug (V1: notFound + revalidate)
  const { variables, layout, dehydratedState } = data;
  return (
    <Hydrate state={dehydratedState}>
      <HomeScreen variables={variables} layout={layout} />
    </Hydrate>
  );
}
