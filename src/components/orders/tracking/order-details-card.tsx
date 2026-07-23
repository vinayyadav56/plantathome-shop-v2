import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { isEmpty } from 'lodash';
import usePrice from '@/lib/use-price';
import { PaymentStatus } from '@/types';
import { isPaymentPending } from '@/lib/is-payment-pending';
import PayNowButton from '@/components/payment/pay-now-button';
import ChangeGateway from '@/components/payment/gateway-control/change-gateway';
import { useSettings } from '@/framework/settings';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-[7px]">
      <dt className="text-[13px] text-[#8C8A81]">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-forest-900">{children}</dd>
    </div>
  );
}

function paymentMethodLabel(gateway?: string | null): string {
  const g = (gateway ?? '').toUpperCase();
  if (g.includes('CASH') || g.includes('COD')) return 'Cash on Delivery';
  if (!g || g === 'N/A') return '—';
  return 'Paid Online';
}

function paymentStatusBadge(status?: string) {
  switch (status) {
    case PaymentStatus.SUCCESS:
      return { text: 'Paid', cls: 'bg-[var(--ds-accent-soft,#EAF4E6)] text-[var(--ds-accent-ink,#2E5E2A)]' };
    case PaymentStatus.COD:
      return { text: 'Pay on Delivery', cls: 'bg-[#FCF3E3] text-[#9A6B1F]' };
    case PaymentStatus.REFUNDED:
    case PaymentStatus.REVERSAL:
      return { text: 'Refunded', cls: 'bg-[#EEF0F3] text-[#4A5568]' };
    case PaymentStatus.FAILED:
      return { text: 'Failed', cls: 'bg-[#FBEAEA] text-[#B23B3B]' };
    default:
      return { text: 'Pending', cls: 'bg-[#FCF3E3] text-[#9A6B1F]' };
  }
}

/**
 * Sidebar "Order Details" card: meta rows + charge breakdown + total, and —
 * when a payment is still due — the Pay Now / change-gateway actions so the
 * redesign keeps the payment flow.
 */
export default function OrderDetailsCard({ order }: { order: any }) {
  const { settings } = useSettings();
  const { price: subtotal } = usePrice({ amount: order?.amount ?? 0 });
  const { price: shipping } = usePrice({ amount: order?.delivery_fee ?? 0 });
  const { price: tax } = usePrice({ amount: order?.sales_tax ?? 0 });
  const { price: discount } = usePrice({ amount: order?.discount ?? 0 });
  const { price: total } = usePrice({ amount: order?.paid_total ?? 0 });
  const { price: wallet } = usePrice({ amount: order?.wallet_point?.amount ?? 0 });

  const badge = paymentStatusBadge(order?.payment_status);
  const paymentDue = isPaymentPending(
    order?.payment_gateway,
    order?.order_status,
    order?.payment_status,
  );
  const gateways: any[] = (settings as any)?.paymentGateway ?? [];

  return (
    <div className="rounded-2xl border border-[#E7E5DC] bg-white px-5 py-5 shadow-sm sm:px-6">
      <h3 className="mb-3 text-base font-semibold text-forest-900">Order Details</h3>

      <dl>
        <Row label="Order Number">{order?.tracking_number}</Row>
        <Row label="Order Date">
          {order?.created_at ? dayjs(order.created_at).format('D MMM, YYYY') : '—'}
        </Row>
        <Row label="Payment Method">{paymentMethodLabel(order?.payment_gateway)}</Row>
        <Row label="Payment Status">
          <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
            {badge.text}
          </span>
        </Row>
      </dl>

      <div className="my-3 border-t border-dashed border-[#E7E5DC]" />

      <dl>
        <Row label="Subtotal">{subtotal}</Row>
        <Row label="Shipping Charges">
          {(order?.delivery_fee ?? 0) > 0 ? (
            shipping
          ) : (
            <span className="font-semibold text-[var(--ds-accent-ink,#2E5E2A)]">FREE</span>
          )}
        </Row>
        {(order?.sales_tax ?? 0) > 0 ? <Row label="Tax">{tax}</Row> : null}
        {(order?.discount ?? 0) > 0 ? (
          <Row label="Discount">
            <span className="font-semibold text-[var(--ds-accent-ink,#2E5E2A)]">- {discount}</span>
          </Row>
        ) : null}
        {order?.wallet_point?.amount ? <Row label="Paid from Wallet">{wallet}</Row> : null}
      </dl>

      <div className="my-3 border-t border-[#E7E5DC]" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-forest-900">Total Amount</span>
        <span className="text-base font-bold text-forest-900">{total}</span>
      </div>

      {paymentDue && !isEmpty(gateways) ? (
        <div className="mt-4 space-y-2 border-t border-dashed border-[#E7E5DC] pt-4">
          <PayNowButton trackingNumber={order?.tracking_number} order={order} />
          {gateways.length > 1 ? <ChangeGateway order={order} /> : null}
        </div>
      ) : null}
    </div>
  );
}
