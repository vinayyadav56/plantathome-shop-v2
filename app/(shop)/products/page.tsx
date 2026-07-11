import { Suspense } from 'react';
import { ProductListing } from '@/components/products/ProductListing';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-wide py-20 text-forest-ink/50">Loading…</div>}>
      <ProductListing />
    </Suspense>
  );
}
