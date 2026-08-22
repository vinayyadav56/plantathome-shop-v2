import ProductLoader from '@/components/ui/loaders/product-loader';
import NotFound from '@/components/ui/not-found';
import rangeMap from '@/lib/range-map';
import ProductCard from '@/components/products/cards/card';
import ErrorMessage from '@/components/ui/error-message';
import { usePopularProducts } from '@/framework/product';
import SectionBlock from '@/components/ui/section-block';
import { useTranslation } from 'next-i18next';
import classNames from 'classnames';
import { PRODUCT_GRID_CLASS } from '@/components/products/product-grid-class';

interface Props {
  className?: string;
  limit?: number;
  variables: any;
  title?: string;
}

export default function PopularProductsGrid({
  className,
  limit = 10,
  variables,
  title,
}: Props) {
  const { t } = useTranslation('common');
  const { products, isLoading, error } = usePopularProducts(variables);

  if (error) return <ErrorMessage message={error.message} />;
  if (!isLoading && !products.length) {
    return (
      <SectionBlock title={title}>
        <NotFound text="text-not-found" className="mx-auto w-7/12" />
      </SectionBlock>
    );
  }

  return (
    <SectionBlock title={title}>
      <div className={classNames(className, 'w-full')}>
        <div className={PRODUCT_GRID_CLASS}>
          {isLoading && !products.length
            ? rangeMap(limit, (i) => (
                <ProductLoader key={i} uniqueKey={`product-${i}`} />
              ))
            : products.map((product: any) => (
                <ProductCard product={product} key={product?.id} />
              ))}
        </div>
      </div>
    </SectionBlock>
  );
}
