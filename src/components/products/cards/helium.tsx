import { Image } from '@/components/ui/image';
import cn from 'classnames';
import usePrice from '@/lib/use-price';
import { useTranslation } from 'next-i18next';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { productPlaceholder } from '@/lib/placeholders';
import { useRouter } from '@/compat/next-router';
import { twMerge } from 'tailwind-merge';
import dynamic from 'next/dynamic';

const AddToCart = dynamic(
  () => import('@/components/products/add-to-cart/add-to-cart').then((m) => m.AddToCart),
  { ssr: false },
);

type HeliumProps = {
  product: any;
  className?: string;
};

const Helium: React.FC<HeliumProps> = ({ product, className }) => {
  const { t } = useTranslation('common');
  const { query } = useRouter();
  const { name, image, unit, min_price, max_price, product_type } = product ?? {};

  const { price, basePrice, discount } = usePrice({
    amount: product.sale_price ? product.sale_price : product.price!,
    baseAmount: product.price,
  });
  const { price: minPrice } = usePrice({ amount: min_price });
  const { price: maxPrice } = usePrice({ amount: max_price });
  const { openModal } = useModalAction();

  function handleProductQuickView() {
    return openModal('PRODUCT_DETAILS', product.slug);
  }

  // City-inventory model: products are always orderable; never show out-of-stock.
  const inStock = true;

  return (
    <article
      className={twMerge(cn('product-card pa-helium cart-type-helium h-full overflow-hidden', className))}
    >
      {/* Image area */}
      <div
        onClick={handleProductQuickView}
        className={cn(
          'relative flex h-48 w-auto items-center justify-center sm:h-64 cursor-pointer overflow-hidden',
          'bg-gradient-to-br from-green-50 to-emerald-50',
          query?.pages?.includes?.('medicine') ? 'm-4 mb-0 rounded-2xl' : '',
        )}
      >
        <span className="sr-only">{t('text-product-image')}</span>
        <Image
          src={image?.original ?? productPlaceholder}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="block object-contain product-image transition-transform duration-500 group-hover:scale-105"
        />

        {/* Discount badge */}
        {discount && (
          <div className="pa-helium-badge absolute top-3 ltr:right-3 rtl:left-3">
            {discount}
          </div>
        )}
      </div>

      {/* Info area */}
      <header className="relative p-3 md:p-4">
        <h3
          onClick={handleProductQuickView}
          role="button"
          className="pa-helium-name mb-1 truncate cursor-pointer hover:text-green-700 transition-colors"
        >
          {name}
        </h3>
        {unit && <p className="text-xs text-gray-400 mb-3">{unit}</p>}

        <div className="flex items-center justify-between gap-2 min-h-[32px]">
          {product_type?.toLowerCase() === 'variable' ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="pa-helium-price text-sm md:text-[15px]">{minPrice}</span>
                <span className="text-gray-300 text-xs">–</span>
                <span className="pa-helium-price text-sm md:text-[15px]">{maxPrice}</span>
              </div>
              {inStock && (
                <button onClick={handleProductQuickView} className="pa-add-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View
                </button>
              )}
            </>
          ) : (
            <>
              <div className="relative">
                {basePrice && (
                  <del className="absolute text-xs italic text-gray-400 -top-4 ltr:left-0">
                    {basePrice}
                  </del>
                )}
                <span className="pa-helium-price text-sm md:text-base">{price}</span>
              </div>
              {inStock && (
                <AddToCart data={product} variant="single" counterVariant="helium" />
              )}
            </>
          )}
        </div>
      </header>
    </article>
  );
};

export default Helium;
