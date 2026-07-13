import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import ProductCard from '../cards/card';
interface Props {
  products: any;
  currentProductId: any;
  gridClassName?: string;
}

const RelatedProducts = ({
  products,
  currentProductId,
  gridClassName,
}: Props) => {
  const { t } = useTranslation('common');

  return (
    <>
      <h2 className="mb-6 text-lg font-semibold tracking-tight text-heading">
        {t('text-related-products')}
      </h2>
      <div
        className={cn(
          'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
          gridClassName
        )}
      >
        {products
          ?.filter((item: any) => currentProductId !== item.id)
          .map((item: any) => (
            // Stable key by product id — filtering the current product out FIRST (instead of
            // returning null mid-map with index keys) so React can't mis-associate card state.
            <ProductCard product={item} key={item.id} cardType={item?.type?.slug} />
          ))}
      </div>
    </>
  );
};
// <motion.div key={idx}>
{
  /* {renderProductCard(
    item,
    "!shadow-none border border-border-200 hover:!border-border-200 border-opacity-70"
  )} */
}
// </motion.div>

export default RelatedProducts;
