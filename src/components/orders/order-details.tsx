import usePrice from '@/lib/use-price';
import { formatAddress } from '@/lib/format-address';
import { useTranslation } from 'next-i18next';
import cn from 'classnames';
import { PILL_BASE, statusPill } from './status-pill';
import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';
import { Eye } from '@/components/icons/eye-icon';
import { OrderItems } from './order-items';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { SadFaceIcon } from '@/components/icons/sad-face';
import Badge from '@/components/ui/badge';
import type { Order } from '@/types';
import OrderViewHeader from './order-view-header';
import OrderStatusProgressBox from '@/components/orders/order-status-progress-box';
import { OrderStatus, PaymentStatus, RefundStatus } from '@/types';
import { useSettings } from '@/framework/settings';

interface Props {
  order: Order;
  loadingStatus?: boolean;
}

/** Refund state in the shared account-area pill language — not the old solid Badge chips
 *  (bg-purple-500 for "pending" appeared nowhere else in the design system). */
const RenderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation('common');
  const key = status.toLowerCase();
  const label =
    key === 'approved'
      ? t('text-approved')
      : key === 'rejected'
        ? t('text-rejected')
        : key === 'processing'
          ? t('text-processing')
          : t('text-pending');

  return (
    <span className={cn(PILL_BASE, statusPill(key))}>
      {t('text-refund')} {label}
    </span>
  );
};

function RefundView({
  status,
  orderId,
}: {
  status: string;
  orderId: string | number;
}) {
  const { t } = useTranslation('common');
  const { openModal } = useModalAction();
  return (
    <>
      {status ? (
        <RenderStatusBadge status={status} />
      ) : (
        <button
          className="pa-btn pa-btn-outline pa-btn-sm disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => openModal('REFUND_REQUEST', orderId)}
          disabled={Boolean(status)}
        >
          <SadFaceIcon width={16} />
          {t('text-ask-refund')}
        </button>
      )}
    </>
  );
}

const OrderDetails = ({ order, loadingStatus }: Props) => {
  const { t } = useTranslation('common');
  const { settings } = useSettings();
  const {
    id,
    products,
    status,
    shipping_address,
    billing_address,
    tracking_number,
    refund,
  }: any = order ?? {};

  const { price: amount } = usePrice({
    amount: order?.amount,
  });
  const { price: discount } = usePrice({
    amount: order?.discount ?? 0,
  });
  const { price: total } = usePrice({
    amount: order?.total,
  });
  const { price: delivery_fee } = usePrice({
    amount: order?.delivery_fee ?? 0,
  });
  const { price: sales_tax } = usePrice({
    amount: order?.sales_tax,
  });
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-kraft-200 bg-white shadow-sm">
      {/* Title + actions. Actions used to be two bare text links jammed into one flex row —
          the ONLY route to the tracking page was an eye-icon link with no button chrome. Real
          buttons now, wrapping under the title on small screens. */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="min-w-0 truncate text-base font-medium text-forest-900">
          {t('text-order-details')}
          <span className="px-2 text-stone-400">·</span>
          <span className="text-stone-500">{tracking_number}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {order?.payment_gateway !== 'CASH_ON_DELIVERY' &&
          order?.payment_status !==
            PaymentStatus?.FAILED?.toLocaleLowerCase() &&
          order?.payment_status !==
            PaymentStatus?.PENDING?.toLocaleLowerCase() ? (
            <RefundView status={refund?.status} orderId={id} />
          ) : (
            ''
          )}
          <Link
            href={Routes.order(tracking_number)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--ds-accent,#4E8B31)] px-4 py-2 text-sm font-semibold text-[var(--ds-accent-ink,#2E5E2A)] transition-colors hover:bg-[var(--ds-accent-soft,#EAF4E6)]"
          >
            <Eye width={18} />
            {t('text-sub-orders')}
          </Link>
        </div>
      </div>
      <div className="relative mx-5 mb-6 overflow-hidden rounded-xl">
        <OrderViewHeader
          order={order}
          wrapperClassName="px-7 py-4"
          buttonSize="small"
          loading={loadingStatus}
        />
      </div>

      {/* One grid, one breakpoint. The old flex split rows at sm: but sized columns at md:,
          so between sm and md two w-full columns shared a row and overflowed. */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 border-b border-kraft-200 px-5 py-5 md:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              {t('text-shipping-address')}
            </span>
            <span className="text-sm leading-relaxed text-stone-600">
              {formatAddress(shipping_address)}
            </span>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              {t('text-billing-address')}
            </span>
            <span className="text-sm leading-relaxed text-stone-600">
              {formatAddress(billing_address)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 md:border-l md:border-kraft-200 md:pl-8">
          <div className="flex justify-between">
            <span className="whitespace-nowrap text-sm text-stone-500">{t('text-sub-total')}</span>
            <span className="text-sm text-forest-900">{amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="whitespace-nowrap text-sm text-stone-500">{t('text-discount')}</span>
            <span className="text-sm text-forest-900">{discount}</span>
          </div>
          <div className="flex justify-between">
            <span className="whitespace-nowrap text-sm text-stone-500">{t('text-delivery-fee')}</span>
            <span className="text-sm text-forest-900">{delivery_fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="whitespace-nowrap text-sm text-stone-500">{t('text-tax')}</span>
            <span className="text-sm text-forest-900">{sales_tax}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-kraft-200 pt-2.5">
            <span className="text-[15px] font-semibold text-forest-900">{t('text-total')}</span>
            <span className="text-[15px] font-semibold text-forest-900">{total}</span>
          </div>
        </div>
      </div>

      {/* Order Table */}
      <div>
        <div className="flex w-full items-center justify-center px-6">
          <OrderStatusProgressBox
            orderStatus={order?.order_status as OrderStatus}
            paymentStatus={order?.payment_status as PaymentStatus}
          />
        </div>
        <OrderItems
          settings={settings}
          products={products}
          orderId={id}
          orderStatus={order?.order_status}
          refund={Boolean(
            order?.refund?.status === RefundStatus?.APPROVED?.toLowerCase(),
          )}
        />
      </div>
    </div>
  );
};

export default OrderDetails;
