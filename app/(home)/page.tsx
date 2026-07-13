import { Hydrate } from '@/compat/react-query-hydration';
import { loadHomeData } from '@/framework/ssr/prefetch';
import HomeScreen from '@/app-shell/home-screen';

// Mirror V1's ISR: admin homepage changes reach the static home within 30s.
export const revalidate = 30;

export default async function HomePage() {
  const data = await loadHomeData();
  // loadHomeData only returns null for unknown verticals — never for home.
  const { variables, layout, dehydratedState } = data!;
  return (
    <Hydrate state={dehydratedState}>
      <HomeScreen variables={variables} layout={layout} />
    </Hydrate>
  );
}
