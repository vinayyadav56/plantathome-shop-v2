'use client';

import PrivateRoute from '@/lib/private-route';
import OrderList, { useSelectedOrder } from '@/components/orders/order-list';
import Seo from '@/components/seo/seo';
import ErrorMessage from '@/components/ui/error-message';
import { useOrders } from '@/framework/order';
import SelectedOrderDetails from '@/components/orders/selected-order-details';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import isEmpty from 'lodash/isEmpty';
import OrderDetails from '@/components/orders/order-details';
import OrderListMobile from '@/components/orders/order-list-mobile';
import NotFound from '@/components/ui/not-found';
import DashboardLayout from '@/layouts/_dashboard';
import { useTranslation } from 'next-i18next';


function NoOrderFound() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center rounded-2xl border border-kraft-200 bg-white p-8">
      <NotFound text="text-no-order-found" />
    </div>
  );
}



export default function OrdersPage() {
  const { t } = useTranslation('common');
  const {
    orders,
    isLoading,
    error,
    hasMore,
    loadMore,
    isLoadingMore,
    isFetching,
  } = useOrders();
  const [selectedOrder] = useSelectedOrder();
  const isLoadingStatus = !isLoadingMore && !isLoading && isFetching;

  const ordersItem: any = orders;

  if (error) return <ErrorMessage message={error.message} />;

  if (isLoading && isEmpty(ordersItem)) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center rounded-2xl border border-kraft-200 bg-white p-8">
        <Spinner simple className="w-10 h-10" />
      </div>
    );
  }

  if (!isLoading && isEmpty(ordersItem)) {
    return <NoOrderFound />;
  }
  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <h1 className="mb-6 hidden font-pahserif text-2xl font-medium text-forest-900 lg:block">
        {t('profile-sidebar-orders')}
      </h1>
      <div className="hidden w-full gap-6 lg:flex">
        <OrderList
          orders={ordersItem}
          isLoadingMore={isLoadingMore}
          loadMore={loadMore}
          hasMore={hasMore}
        />
        {selectedOrder && (
          <SelectedOrderDetails
            selected={selectedOrder}
            listOrder={ordersItem.find((order: any) => order.id === selectedOrder.id)}
            loadingStatus={isLoadingStatus}
          />
        )}
      </div>
      <OrderListMobile
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        hasNextPage={hasMore}
        orders={ordersItem}
        loadingStatus={isLoadingStatus}
      />
    </>
  );
}

// The account sidebar lives in ONE layout, shared with profile/wishlists/my-packages-adjacent
// pages. The hand-rolled max-w-7xl wrapper here was one of three competing account containers.
// (This move was reverted once during the order-history crash scare; the crash turned out to be
// the pivot-less list rows, fixed and pinned in selected-order-details — safe now.)
const getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

// OrdersPage.authenticationRequired = true;

OrdersPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <OrdersPage {...props} />;
  const withLayout = (OrdersPage as any).getLayout ? (OrdersPage as any).getLayout(page) : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
