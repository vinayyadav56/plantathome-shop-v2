'use client';

import PrivateRoute from '@/lib/private-route';
import Card from '@/components/ui/cards/card';
import { useTranslation } from 'next-i18next';
import DownloadableProducts from '@/components/products/downloadable-products';
import Seo from '@/components/seo/seo';
import DashboardLayout from '@/layouts/_dashboard';


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

DownloadableProductsPage.authenticationRequired = true;

DownloadableProductsPage.getLayout = function getLayout(
  page: React.ReactElement
) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DownloadableProductsPage;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <DownloadableProductsPage {...props} />;
  const withLayout = (DownloadableProductsPage as any).getLayout ? (DownloadableProductsPage as any).getLayout(page) : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
