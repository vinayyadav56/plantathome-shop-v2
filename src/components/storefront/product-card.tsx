import React from 'react';
import PlantAtHomeCard from '@/components/products/cards/plantathome';
import type { Product } from '@/types';

/**
 * Homepage/storefront product card. Delegates to the single unified listing
 * card (`PlantAtHomeCard`) so the home grids, listing pages and checkout
 * recommendations all share one reference-style card (feature grid + Add to
 * Cart). Export name kept for caller compatibility.
 */
export function StorefrontProductCard({
  product,
}: {
  product: Product;
  /** kept for caller API compatibility; not rendered */
  tag?: string;
}) {
  return <PlantAtHomeCard product={product} />;
}
