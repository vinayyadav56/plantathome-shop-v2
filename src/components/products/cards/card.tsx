import type { Product } from '@/types';

// Plant At Home uses ONE consistent small-luxury product card across every
// product type, so the listing matches the home grid. (Upstream Pickbazar
// routed by `type.settings.productCard` to per-type cards — neon/helium/etc.)
// App Router port: STATIC import — this card always renders, and next/dynamic
// of always-rendered components infinite-loops hydration under React 19 (the
// PDP's SSR'd related-products grid hit exactly that).
import PlantAtHome from '@/components/products/cards/plantathome';

interface ProductCardProps {
  product: Product;
  className?: string;
  cardType?: any;
  // preload this card's image (LCP candidates in the first grid row)
  priority?: boolean;
  layout?: 'grid' | 'list';
}
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className,
  ...props
}) => {
  return <PlantAtHome product={product} {...props} className={className} />;
};
export default ProductCard;
