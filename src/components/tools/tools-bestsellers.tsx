'use client';

import { Grid } from '@/components/products/grid';
import { useProducts } from '@/framework/product';
import { SectionHead } from './section-head';
import { SECTION } from './tools-content';

/**
 * /tools "Tools gardeners love": the vertical's six best-sellers in the PLP
 * product card, six across from `lg`, three on tablets and two on phones.
 *
 * Uses the same useProducts options as loadToolsData's bestsellers list, so the
 * cards arrive as server HTML. Shows skeleton cards while loading. The whole
 * section is absent when the API lists no products: never placeholder products.
 *
 * @param type the vertical slug (`tools`)
 */
export function ToolsBestsellers({ type }: { type: string }) {
  const { products, isLoading } = useProducts({
    type,
    limit: 6,
    orderBy: 'sold_quantity',
    sortedBy: 'DESC',
  });

  if (!isLoading && !products.length) return null;

  return (
    <section aria-labelledby="tools-bestsellers" className="mt-14 lg:mt-20">
      <SectionHead id="tools-bestsellers" {...SECTION.bestsellers} />
      <Grid
        products={products}
        isLoading={isLoading}
        cardVariant="plp"
        // Below the hero's LCP image: no card image is preloaded.
        priorityCount={0}
        hasMore={false}
        limit={6}
        gridClassName="mt-6 !grid-cols-2 !gap-x-[15px] !gap-y-5 md:!grid-cols-3 lg:!grid-cols-6"
      />
    </section>
  );
}

export default ToolsBestsellers;
