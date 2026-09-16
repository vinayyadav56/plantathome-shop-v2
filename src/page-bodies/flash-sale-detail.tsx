'use client';

import DetailsView from '@/components/flash-sale/details-view';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';
import Seo from '@/components/seo/seo';
import ErrorMessage from '@/components/ui/error-message';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import {
  useFlashSale
} from '@/framework/flash-sales';
import type {
  FlashSale
} from '@/types';
import { isEmpty } from 'lodash';
import { useTranslation } from 'next-i18next';
import { useRouter } from '@/compat/next-router';

const FlashSalePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = useRouter();
  const {
    query: { slug },
  } = useRouter();
  const { flashSale, loading, error } = useFlashSale({
    slug: slug as string,
    language: locale as string,
  });

  // const {
  //   products,
  //   isLoading,
  //   error: productError,
  // } = useFlashSaleProductBySlug({
  //   slug: slug as string,
  //   language: locale as string,
  // });

  // if (loading || isLoading) {
  //   return <Spinner showText={false} />;
  // }
  if (loading) {
    return <Spinner showText={false} />;
  }

  if (error) return <ErrorMessage message={error?.message} />;
  // if (error || productError) return <ErrorMessage message={error?.message || productError?.message} />;

  return (
    <>
      <Seo
        title={flashSale?.title!}
        url={flashSale?.slug!}
        images={
          !isEmpty(flashSale?.cover_image) ? [flashSale?.cover_image] : []
        }
      />
      <DetailsView
        flashSale={flashSale as unknown as FlashSale}
        products={flashSale?.products as FlashSale['products']}
      />
    </>
  );
};

FlashSalePage.getLayout = getLayoutWithFooter;

export default FlashSalePage;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <FlashSalePage {...props} />;
  const withLayout = (FlashSalePage as any).getLayout ? (FlashSalePage as any).getLayout(page) : page;
  return withLayout;
}
