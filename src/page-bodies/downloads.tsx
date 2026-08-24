'use client';

import Card from '@/components/ui/cards/card';
import { useTranslation } from 'next-i18next';
import DownloadableProducts from '@/components/products/downloadable-products';
import Seo from '@/components/seo/seo';


const DownloadableProductsPage = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Card className="relative w-full self-stretch shadow-none sm:shadow">
        <h1 className="mb-8 text-center font-pahserif text-xl font-medium text-forest-900 sm:mb-10 sm:text-xl">
          {t('text-downloads')}
        </h1>
        <DownloadableProducts />
      </Card>
    </>
  );
};



export default DownloadableProductsPage;


/* ── App Router body wrapper — chrome + auth live in app/(account)/layout.tsx ── */

export function PageBody(props: any) {
  return <DownloadableProductsPage {...props} />;
}
