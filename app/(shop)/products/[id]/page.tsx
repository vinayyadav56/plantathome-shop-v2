import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/api/endpoints';
import { ProductDetail } from '@/components/pdp/ProductDetail';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
