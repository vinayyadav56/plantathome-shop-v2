"use client";

import { getLayout } from "@/components/layouts/layout";
import Order from "@/components/orders/order-view";
import Seo from "@/components/seo/seo";
import { useEffect, useRef } from "react";
import { PaymentStatus } from "@/types";
import Spinner from "@/components/ui/loaders/spinner/spinner";
import OrderLoadError from "@/components/orders/order-load-error";
import { useOrder } from "@/framework/order";
import { useRouter } from "@/compat/next-router";
import { useModalAction } from "@/components/ui/modal/modal.context";
import { useSettings } from "@/framework/settings";

export default function OrderPage() {
  const { settings } = useSettings();
  const { openModal } = useModalAction();
  const { query } = useRouter();
  // Read the route param defensively. `query.tracking_number!.toString()` threw a
  // TypeError whenever the param was momentarily absent (the compat shim's params are
  // empty on the server snapshot and for a frame after a client-side push), and that
  // throw reached the route error boundary — a dead-end screen on the money path.
  const tracking_number = query?.tracking_number?.toString() ?? "";
  const { order, isLoading, isFetching, error, refetch } = useOrder({
    tracking_number,
  });

  // @ts-ignore
  // tracking_number comes from the route param above — the order echoes the same value.
  const { payment_status, payment_intent } = order ?? {};
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
    if (
      isPaymentModalEnabled &&
      intentId &&
      openedForRef.current !== intentId
    ) {
      openedForRef.current = intentId;
      openModal("PAYMENT_MODAL", {
        paymentGateway: payment_intent?.payment_gateway,
        paymentIntentInfo: payment_intent?.payment_intent_info,
        trackingNumber: tracking_number,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaymentModalEnabled, payment_intent?.payment_intent_info?.payment_id]);

  // No tracking number yet (params not resolved): show the loader, never throw.
  if (!tracking_number || isLoading || (!order && isFetching)) {
    return <Spinner showText={false} />;
  }

  // A settled fetch with no order used to fall through and render a fully
  // BLANK order shell ("Order #", ₹0.00, dead Pay Now). Say what happened.
  if (!order) {
    return (
      <>
        <Seo noindex={true} nofollow={true} />
        <OrderLoadError error={error} onRetry={() => refetch()} />
      </>
    );
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
  const withLayout = (OrderPage as any).getLayout
    ? (OrderPage as any).getLayout(page)
    : page;
  return withLayout;
}
