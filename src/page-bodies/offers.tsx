'use client';

import type { NextPageWithLayout } from '@/types';
import Seo from '@/components/seo/seo';
import Button from '@/components/ui/button';
import NotFound from '@/components/ui/not-found';
import { useTranslation } from 'next-i18next';
import rangeMap from '@/lib/range-map';
import CouponLoader from '@/components/ui/loaders/coupon-loader';
import { useCoupons } from '@/framework/coupon';
import ErrorMessage from '@/components/ui/error-message';
import CouponCard from '@/components/ui/cards/coupon';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';
import PageBanner from '@/components/banners/page-banner';
import { isEmpty } from 'lodash';
import { Tab } from '@headlessui/react';
import CorporatePanel from '@/components/offers/corporate-panel';

const OffersPage: NextPageWithLayout = () => {
  const limit = 20;
  const { t } = useTranslation('common');
  const { isLoading, isLoadingMore, hasMore, coupons, error, loadMore } =
    useCoupons({ limit });
  const isValidCoupon = coupons.filter(
    (item: any) => Boolean(item?.is_approve) && Boolean(item?.is_valid),
  );

  if (error) return <ErrorMessage message={error.message} />;

  return (
    <>
      <Seo title="Offers" url="offers" />
      <PageBanner
        title={t('text-offers-title')}
        breadcrumbTitle={t('text-home')}
      />
      <div className="w-full px-5 py-12 mx-auto g-light-a max-w-1920 lg:py-14 lg:px-8 xl:py-24 xl:px-16 2xl:px-20">
        <Tab.Group>
          <Tab.List className="flex flex-wrap gap-2">
            {[t('common:text-tab-offers'), t('common:text-tab-corporate')].map(
              (label) => (
                <Tab
                  key={label}
                  className={({ selected }) =>
                    `rounded-full px-5 py-2 text-sm font-semibold outline-none transition ${
                      selected
                        ? 'bg-forest-700 text-white'
                        : 'border border-kraft-200 bg-white text-stone-500 hover:text-forest-700'
                    }`
                  }
                >
                  {label}
                </Tab>
              ),
            )}
          </Tab.List>
          <Tab.Panels className="mt-8">
            <Tab.Panel>
              {!isLoading && isEmpty(coupons) ? (
                <div className="max-w-lg px-5 pt-6 pb-8 mx-auto lg:p-8">
                  <NotFound text="text-no-coupon" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xl:gap-8 2xl:grid-cols-6">
                    {isLoading && isEmpty(isValidCoupon) ? (
                      rangeMap(6, (i) => (
                        <CouponLoader key={i} uniqueKey={`coupon-${i}`} />
                      ))
                    ) : !isEmpty(isValidCoupon) ? (
                      isValidCoupon?.map((item: any) => (
                        <CouponCard key={item.id} coupon={item} />
                      ))
                    ) : (
                      <div className="max-w-lg mx-auto col-span-full">
                        <NotFound text="text-no-coupon" />
                      </div>
                    )}
                  </div>
                  {hasMore && (
                    <div className="flex items-center justify-center mt-8 lg:mt-12">
                      <Button onClick={loadMore} loading={isLoadingMore}>
                        {t('text-load-more')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Tab.Panel>
            <Tab.Panel>
              <CorporatePanel />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

    </>
  );
};

OffersPage.getLayout = getLayoutWithFooter;

export default OffersPage;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <OffersPage {...props} />;
  const withLayout = (OffersPage as any).getLayout ? (OffersPage as any).getLayout(page) : page;
  return withLayout;
}
