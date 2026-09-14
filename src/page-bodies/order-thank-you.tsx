'use client';

import { getLayout } from '@/components/layouts/layout';
import Order from '@/components/orders/order-view';
import Seo from '@/components/seo/seo';
import { useEffect, useState } from 'react';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import OrderLoadError from '@/components/orders/order-load-error';
import { useOrder, useOrderPayment } from '@/framework/order';
import { useRouter } from '@/compat/next-router';
import { toast } from 'react-toastify';
import { useTranslation } from 'next-i18next';
import { useSettings } from '@/framework/settings';


export default function OrderPage() {
  const { settings } = useSettings();
  const { query } = useRouter();
  const { t } = useTranslation();
  const { order, isLoading, isFetching, error, refetch } = useOrder({
    tracking_number: query?.tracking_number?.toString() ?? '',
  });
  const { createOrderPayment } = useOrderPayment();

  useEffect(() => {
    switch (order?.payment_status) {
      case 'payment-pending':
        toast.success(`${t('payment-pending')}`);
        break;

      case 'payment-awaiting-for-approval':
        toast.success(`${t('payment-awaiting-for-approval')}`);
        break;

      case 'payment-processing':
        toast.success(`${t('payment-processing')}`);
        break;

      case 'payment-success':
        toast.success(`${t('payment-success')}`);
        break;

      case 'payment-reversal':
        toast.error(`${t('payment-reversal')}`);
        break;

      case 'payment-failed':
        toast.error(`${t('payment-failed')}`);
        break;
    }
  }, [order?.payment_status]);

  useEffect(() => {
    const gateway = order?.payment_gateway;
    if (!isLoading && typeof gateway === 'string' && gateway) {
      createOrderPayment({
        tracking_number: query?.tracking_number as string,
        payment_gateway: gateway.toLowerCase(),
      });
    }
  }, [order?.payment_status]);

  if (isLoading || (!order && isFetching)) {
    return <Spinner showText={false} />;
  }

  // Settled with no order → say so instead of the blank order shell.
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
  const withLayout = (OrderPage as any).getLayout ? (OrderPage as any).getLayout(page) : page;
  return withLayout;
}
