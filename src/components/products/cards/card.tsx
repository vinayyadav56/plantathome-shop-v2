import type { Product } from '@/types';
import dynamic from 'next/dynamic';

// Plant At Home uses ONE consistent small-luxury product card across every
// product type, so the listing matches the home grid. (Upstream Pickbazar
// routed by `type.settings.productCard` to per-type cards — neon/helium/etc.
// Those products are configured with non-plantathome settings, which meant
// the listing rendered an off-brand card with price ranges + boxed "+".)
const PlantAtHome = dynamic(
  () => import('@/components/products/cards/plantathome'),
);

interface ProductCardProps {
  product: Product;
  className?: string;
  cardType?: any;
  // preload this card's image (LCP candidates in the first grid row)
  priority?: boolean;
}
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  ...props
}) => {
  return <PlantAtHome product={product} {...props} className={className} />;
};
export default ProductCard;
