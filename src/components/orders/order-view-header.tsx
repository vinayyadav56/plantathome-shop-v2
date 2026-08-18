import { useTranslation } from 'next-i18next';
import cn from 'classnames';
import { PILL_BASE, statusPill } from '@/components/orders/status-pill';
import PayNowButton from '@/components/payment/pay-now-button';
import { isPaymentPending } from '@/lib/is-payment-pending';
import { SpinnerLoader } from '@/components/ui/loaders/spinner/spinner';
import ChangeGateway from '@/components/payment/gateway-control/change-gateway';
import { useSettings } from '@/framework/settings';
import { isEmpty } from 'lodash';
import { Order, RefundStatus } from '@/types';

interface OrderViewHeaderProps {
  order: Order;
  wrapperClassName?: string;
  buttonSize?: 'big' | 'medium' | 'small';
  loading?: boolean;
}

/**
 * The status strip. It was a hardcoded blue-grey (#F7F8FA — a colour from nowhere in the
 * design system) with 9px Badge chips and a lattice of `order-2 basis-full` hacks to survive
 * mobile. Now: the house warm surface, the shared status pills at a legible size, and a plain
 * wrapping flex row that stacks naturally.
 */
function StatusCell({
  label,
  value,
  loading,
}: {
  label: string;
  value?: string | null;
  loading?: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {loading ? (
        <SpinnerLoader />
      ) : (
        <span className={cn(PILL_BASE, statusPill(value), 'capitalize')}>
          {t(value ?? '')}
        </span>
      )}
    </div>
  );
}

export default function OrderViewHeader({
  order,
  wrapperClassName = 'px-5 py-4',
  loading = false,
}: OrderViewHeaderProps) {
  const { settings, isLoading } = useSettings();
  const { t } = useTranslation('common');
  const isPaymentActionPending = isPaymentPending(
    //@ts-ignore
    order?.payment_gateway,
    order?.order_status,
    order?.payment_status,
  );
  const paymentGateway = settings?.paymentGateway;
  const refundApproved =
    order?.refund?.status === RefundStatus?.APPROVED?.toLowerCase();

  return (
    <div className={cn('rounded-xl bg-[#F8F7F2]', wrapperClassName)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <StatusCell
          label={t('text-order-status')}
          value={order?.order_status}
          loading={loading}
        />
        <StatusCell
          label={t('text-payment-status')}
          value={order?.payment_status}
          loading={loading}
        />
        {refundApproved ? (
          <StatusCell
            label={t('text-refund-status')}
            value={order?.refund?.status}
            loading={loading}
          />
        ) : null}

        {!isLoading && !isEmpty(paymentGateway) && isPaymentActionPending ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <PayNowButton trackingNumber={order?.tracking_number} order={order} />
            {/* @ts-ignore */}
            {paymentGateway?.length > 1 ? <ChangeGateway order={order} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
