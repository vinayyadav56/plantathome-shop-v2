import Spinner from '@/components/ui/loaders/spinner/spinner';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { useModalAction } from '@/components/ui/modal/modal.context';
import Details from './details';
import PlantAtHomeProductDetails from './plantathome-details';
import ShortDetails from './short-details';
import { stickyShortDetailsAtom } from '@/store/sticky-short-details-atom';
import { useAtom } from 'jotai';
import { AttributesProvider } from './attributes.context';
import { useProduct } from '@/framework/product';
import RelatedProducts from './related-products';


interface ProductPopupProps {
  productSlug: string;
}
const Popup: React.FC<ProductPopupProps> = ({ productSlug }) => {
  const { t } = useTranslation('common');
  const { closeModal } = useModalAction();
  const [showStickyShortDetails] = useAtom(stickyShortDetailsAtom);
  const { product, isLoading } = useProduct({ slug: productSlug });

  const productItem: any = product;

  const { id, related_products } = product ?? {};

  if (isLoading || !product)
    return (
      <div className="relative flex items-center justify-center h-96 w-96 bg-white">
        <Spinner text={t('common:text-loading')} />
      </div>
    );
  return (
    <AttributesProvider>
      <article className="relative z-[51] w-full max-w-6xl bg-white md:rounded-xl xl:min-w-[1152px]">
        {/* close — always-visible cross so the quick view is easy to dismiss */}
        <button
          type="button"
          onClick={closeModal}
          aria-label={t('text-close')}
          className="absolute right-3 top-3 z-[60] grid h-9 w-9 place-items-center rounded-full bg-white/95 text-stone-500 shadow-[0_2px_10px_rgba(20,40,24,0.18)] transition hover:text-forest-900 hover:shadow-[0_4px_14px_rgba(20,40,24,0.25)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {/* Sticky bar */}
        <ShortDetails product={productItem} isSticky={showStickyShortDetails} />
        {/* End of sticky bar */}
        {productItem?.type?.slug === 'books' ? (
          <Details product={productItem} backBtn={false} isModal={true} />
        ) : (
          <PlantAtHomeProductDetails product={productItem} isModal={true} />
        )}

        {related_products?.length! > 1 && (
          <div className="p-5 md:pb-10 lg:p-14 xl:p-16">
            <RelatedProducts
              products={related_products}
              currentProductId={id}
            />
          </div>
        )}
      </article>
    </AttributesProvider>
  );
};

export default Popup;
