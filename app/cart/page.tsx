import { Hydrate } from '@/compat/react-query-hydration';
import { loadGeneralData } from '@/framework/ssr/prefetch';
import { PageBody } from '@/page-bodies/cart';

import type { Metadata } from 'next';

// The cart is per-visitor state — never index it.
export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default async function Page() {
  const { dehydratedState } = await loadGeneralData();
  return (
    <Hydrate state={dehydratedState}>
      <PageBody />
    </Hydrate>
  );
}
