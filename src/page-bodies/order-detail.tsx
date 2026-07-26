'use client';

import { getLayout } from '@/components/layouts/layout';
import Order from '@/components/orders/order-view';
import Seo from '@/components/seo/seo';
import { useRouter } from '@/compat/next-router';
import { useOrder } from '@/framework/order';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { useSettings } from '@/framework/settings';
import PrivateRoute from '@/lib/private-route';

export default function OrderPage() {
  const { query } = useRouter();
  const { settings } = useSettings();

  const { order, isLoading, isFetching } = useOrder({
    tracking_number: query.tracking_number!.toString(),
  });

  if (isLoading) {
    return <Spinner showText={false} />;
  }

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Order
        order={order}
        loadingStatus={!isLoading && isFetching}
        settings={settings}
      />
    </>
  );
}

OrderPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <OrderPage {...props} />;
  const withLayout = (OrderPage as any).getLayout ? (OrderPage as any).getLayout(page) : page;
  // Account page like /orders: a guest deep-linking an order URL gets the
  // in-place login, not an empty order shell (guest tracking lives at
  // /track-order, which stays public). The port had dropped this guard.
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
