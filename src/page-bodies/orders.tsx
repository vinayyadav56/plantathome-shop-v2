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
import DashboardLayout from '@/layouts/_dashboard';


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

// The account sidebar lives in ONE layout, shared with profile/wishlists/questions/reports and the
// rest. This page used to build its own wrapper at a different max-width, and because the wrapper is
// mx-auto, a different width means a different centred left edge — the sidebar visibly jumped
// sideways on every navigation (136px between profile and here). Same nav, same place.
const getLayout = (page: React.ReactElement) => <DashboardLayout>{page}</DashboardLayout>;

// OrdersPage.authenticationRequired = true;

OrdersPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <OrdersPage {...props} />;
  const withLayout = (OrdersPage as any).getLayout ? (OrdersPage as any).getLayout(page) : page;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
