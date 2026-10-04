import { useProducts } from '@/framework/product';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import { ProductGrid } from './product-grid';
import { getVerticalMeta } from '../verticals';
import type { Type } from '@/types';

/** One product row per vertical (plants / tools / farmbox), each with a
 *  "View all" button → that vertical's shop page. */
function VerticalRow({ type, tint }: { type: Type; tint?: boolean }) {
  const { products, isLoading } = useProducts({
    // @ts-ignore — framework accepts a type slug filter
    type: type.slug,
    limit: 4,
  });
  const meta = getVerticalMeta(type.slug, type.name);
  return (
    <ProductGrid
      products={products}
      typeSlug={type.slug}
      isLoading={isLoading}
      eyebrow={meta.label}
      title={meta.tagline}
      viewAllTo={`/${type.slug}`}
      viewAllLabel={`View all ${meta.label}`}
      tint={tint}
    />
  );
}

/** Homepage: all three verticals as their own product section. */
export function HomeVerticalGrids() {
  const { types } = useTypes({ limit: TYPES_PER_PAGE });
  const list = (types ?? []).slice(0, 3);
  if (list.length === 0) return null;
  return (
    <>
      {list.map((t, i) => (
        <VerticalRow key={t.slug} type={t} tint={i % 2 === 1} />
      ))}
    </>
  );
}
