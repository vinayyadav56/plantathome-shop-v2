'use client';

import { getLayout } from '@/components/layouts/layout';
import Order from '@/components/orders/order-view';
import Seo from '@/components/seo/seo';
import { useRouter } from '@/compat/next-router';
import { useOrder } from '@/framework/order';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { useSettings } from '@/framework/settings';
import PrivateRoute from '@/lib/private-route';
import { useHasMounted } from '@/lib/use-has-mounted';
import { getOrderToken } from '@/lib/order-token';

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
  const { query } = useRouter();
  const hasMounted = useHasMounted();
  const page = <OrderPage {...props} />;
  const withLayout = (OrderPage as any).getLayout ? (OrderPage as any).getLayout(page) : page;

  // The per-order token IS the authorization for a guest order: the API serves
  // `orders/{tracking}` on a PUBLIC route and authorizes by hash_equals on
  // tracking_token, so a token-bearing URL needs no session. Guarding those
  // would dead-end the guest's only order confirmation — guest checkout is COD,
  // it redirects straight here with `?token=`, and a guest (customer_id null)
  // gets no confirmation email to fall back on. Guard only the tokenless case,
  // where an account is genuinely the sole way to authorize.
  const urlToken = Array.isArray(query?.token) ? query.token[0] : query?.token;
  const trackingNumber = query?.tracking_number?.toString() ?? '';
  // URL token is stable across SSR/hydration; the localStorage fallback is
  // client-only, so it is read only after mount (PrivateRoute renders its
  // ssr:false loader until then, so both passes agree).
  const hasOrderToken =
    Boolean(urlToken) || (hasMounted && Boolean(getOrderToken(trackingNumber)));

  if (hasOrderToken) return withLayout;
  return <PrivateRoute>{withLayout}</PrivateRoute>;
}
