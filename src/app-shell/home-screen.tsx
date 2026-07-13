'use client';

/**
 * Client body of V1's pages/[[...pages]].tsx — the home/vertical screen.
 * Renders inside <Hydrate> from the server page; HomeLayout is applied here
 * (App Router route-group layouts can't receive page props like `layout`).
 */

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from '@/compat/next-router';
import { scroller } from 'react-scroll';
import HomeLayout from '@/components/layouts/_home';
import Seo from '@/components/seo/seo';
import { useWindowSize } from '@/lib/use-window-size';
import { useType } from '@/framework/type';

const CartCounterButton = dynamic(() => import('@/components/cart/cart-counter-button'), { ssr: false });
const Classic = dynamic(() => import('@/components/layouts/classic'));
const Standard = dynamic(() => import('@/components/layouts/standard'));
const Modern = dynamic(() => import('@/components/layouts/modern'));
const Minimal = dynamic(() => import('@/components/layouts/minimal'));
const Compact = dynamic(() => import('@/components/layouts/compact'));
import PlantAtHome from '@/components/layouts/plantathome';

// Single-brand shop: every PlantAtHome vertical renders the premium immersive
// storefront. `classic` + `default` map to it (verbatim from V1).
const MAP_LAYOUT_TO_GROUP: Record<string, any> = {
  classic: PlantAtHome,
  plantathome: PlantAtHome,
  modern: Modern,
  standard: Standard,
  minimal: Minimal,
  compact: Compact,
  default: PlantAtHome,
};

export default function HomeScreen({ variables, layout }: { variables: any; layout: string }) {
  const { query } = useRouter();
  const { width } = useWindowSize();
  const { type } = useType(variables.types.type);

  useEffect(() => {
    if (query.text || query.category) {
      scroller.scrollTo('grid', {
        smooth: true,
        offset: -110,
      });
    }
  }, [query.text, query.category]);

  const Component = MAP_LAYOUT_TO_GROUP[layout];
  return (
    <HomeLayout layout={layout}>
      <Seo title={type?.name} url={type?.slug} images={type?.banners} />
      <Component variables={variables} />
      {!['compact', 'minimal'].includes(layout) && width > 767 && <CartCounterButton />}
    </HomeLayout>
  );
}
