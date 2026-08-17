'use client';

import PrivateRoute from '@/lib/private-route';
import OrderList, { useSelectedOrder } from '@/components/orders/order-list';
import Seo from '@/components/seo/seo';
import ErrorMessage from '@/components/ui/error-message';
import { useOrders } from '@/framework/order';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import isEmpty from 'lodash/isEmpty';
import OrderDetails from '@/components/orders/order-details';
import OrderListMobile from '@/components/orders/order-list-mobile';
import NotFound from '@/components/ui/not-found';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import DashboardSidebar from '@/components/dashboard/sidebar';


function NoOrderFound() {
  return (
    <div className="my-auto flex h-[80vh] w-full items-center justify-center rounded bg-light p-5 md:p-8">
      <NotFound text="text-no-order-found" />
    </div>
  );
}

export default function OrdersPage() {
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
      <div className="my-auto flex h-[80vh] w-full items-center justify-center rounded bg-light p-5 md:p-8">
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
      <div className="hidden w-full overflow-hidden md:flex">
        <OrderList
          orders={ordersItem}
          isLoadingMore={isLoadingMore}
          loadMore={loadMore}
          hasMore={hasMore}
        />
        {selectedOrder && (
          <OrderDetails
            order={
              ordersItem.find((order: any) => order.id === selectedOrder.id)!
            }
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

const getLayout = (page: React.ReactElement) =>
  getSiteLayout(
    // `hidden … xl:block` used to remove the ENTIRE sidebar below 1280px, which
    // killed its own built-in <lg pill-tab strip too — sub-xl users had zero
    // account navigation on this page. Render it at every width and split at lg
    // (the sidebar's internal breakpoint): <lg gets the horizontal tab strip,
    // lg+ gets the card sidebar. Same fix as my-packages.tsx.
    <div className="flex flex-col items-start w-full px-5 py-10 mx-auto max-w-7xl bg-light lg:bg-[#F8F7F2] lg:flex-row xl:py-14 xl:px-8 2xl:px-14">
      <DashboardSidebar className="w-full shrink-0 ltr:lg:mr-8 rtl:lg:ml-8 lg:w-80" />
      {page}
    </div>
  );

// OrdersPage.authenticationRequired = true;

OrdersPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <OrdersPage {...props} />;
  const withLayout = (OrdersPage as any).getLayout ? (OrdersPage as any).getLayout(page) : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
