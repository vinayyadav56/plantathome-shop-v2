'use client';

import { getLayout } from '@/components/layouts/layout';
import Order from '@/components/orders/order-view';
import Seo from '@/components/seo/seo';
import { useEffect, useRef } from 'react';
import { PaymentStatus } from '@/types';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { useOrder } from '@/framework/order';
import { useRouter } from '@/compat/next-router';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useSettings } from '@/framework/settings';


export default function OrderPage() {
  const { settings } = useSettings();
  const { openModal } = useModalAction();
  const { query } = useRouter();
  const { order, isLoading, isFetching } = useOrder({
    tracking_number: query.tracking_number!.toString(),
  });

  // @ts-ignore
  const { payment_status, payment_intent, tracking_number } = order ?? {};
  const isPaymentModalEnabled =
    payment_status === PaymentStatus.PENDING &&
    payment_intent?.payment_intent_info &&
    !payment_intent?.payment_intent_info?.is_redirect;

  // Auto-open ONCE per payment intent. The old deps included the intent OBJECT, whose
  // identity changes on every refetch — dismissing the Razorpay window triggered a refetch,
  // which re-fired this effect and reopened the window forever (D11).
  const openedForRef = useRef<string | null>(null);
  useEffect(() => {
    const intentId = payment_intent?.payment_intent_info?.payment_id ?? null;
    if (isPaymentModalEnabled && intentId && openedForRef.current !== intentId) {
      openedForRef.current = intentId;
      openModal('PAYMENT_MODAL', {
        paymentGateway: payment_intent?.payment_gateway,
        paymentIntentInfo: payment_intent?.payment_intent_info,
        trackingNumber: tracking_number,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaymentModalEnabled, payment_intent?.payment_intent_info?.payment_id]);

  if (isLoading) {
    return <Spinner showText={false} />;
  }

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      <Order
        settings={settings}
        order={order}
        loadingStatus={!isLoading && isFetching}
      />
    </>
  );
}

OrderPage.getLayout = getLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <OrderPage {...props} />;
  const withLayout = (OrderPage as any).getLayout ? (OrderPage as any).getLayout(page) : page;
  return withLayout;
}
