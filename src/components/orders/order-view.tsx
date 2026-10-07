import { useOrderShipments } from '@/framework/order';
import { OrderStatus, RefundStatus } from '@/types';
import SuborderItems from '@/components/orders/suborder-items';
import ParcelShipments from '@/components/orders/parcel-shipments';
import TrackingHero from '@/components/orders/tracking/tracking-hero';
import OrderSummaryCard from '@/components/orders/tracking/order-summary-card';
import EstimatedDeliveryBanner from '@/components/orders/tracking/estimated-delivery-banner';
import LiveTrackingCard from '@/components/orders/tracking/live-tracking-card';
import OrderDetailsCard from '@/components/orders/tracking/order-details-card';
import DeliveryAddressCard from '@/components/orders/tracking/delivery-address-card';
import NeedHelpCard from '@/components/orders/tracking/need-help-card';
import OrderItemsCard from '@/components/orders/tracking/order-items-card';
import UspBand from '@/components/orders/tracking/usp-band';

const TERMINAL_STATUSES: string[] = [
  OrderStatus.CANCELLED,
  OrderStatus.FAILED,
  OrderStatus.REFUNDED,
];

const TERMINAL_COPY: Record<string, { title: string; text: string }> = {
  [OrderStatus.CANCELLED]: {
    title: 'This order was cancelled',
    text: 'If you were charged, the amount will be refunded to your original payment method.',
  },
  [OrderStatus.FAILED]: {
    title: 'This order failed',
    text: 'Something went wrong while processing this order. Please reach out to support.',
  },
  [OrderStatus.REFUNDED]: {
    title: 'This order was refunded',
    text: 'The amount has been returned to your original payment method.',
  },
};

function TerminalStatusBanner({ status }: { status: string }) {
  const copy = TERMINAL_COPY[status] ?? TERMINAL_COPY[OrderStatus.CANCELLED];
  return (
    <div className="shadow-box rounded-2xl border border-[#F0D9D9] bg-[#FBF1F1] px-6 py-5 text-center">
      <p className="text-[15px] font-semibold text-[#B23B3B]">{copy.title}</p>
      <p className="mt-1 text-[13px] text-[#8C6A6A]">{copy.text}</p>
    </div>
  );
}

function OrderView({ order, settings, loadingStatus }: any) {
  // NOTE: no cart/checkout reset here. This view renders order HISTORY and the payment page
  // too — resetting on mount emptied the live cart whenever a customer opened a past order.
  // The reset now happens once, in useCreateOrder's success handler (the order consumed it).
  const { shipments } = useOrderShipments({
    tracking_number: order?.tracking_number,
  });

  const isTerminal = TERMINAL_STATUSES.includes(order?.order_status);
  const isRefundApproved = Boolean(
    order?.refund?.status === RefundStatus?.APPROVED?.toLowerCase(),
  );

  return (
    <div className="w-full bg-[#F6F5F0]">
      <TrackingHero trackingNumber={order?.tracking_number} />

      <div className="mx-auto w-full max-w-[1280px] px-4 pb-14 pt-6 sm:px-6">
        <div className="space-y-5">
          <OrderSummaryCard order={order} loading={loadingStatus} />

          {isTerminal ? (
            <TerminalStatusBanner status={order?.order_status} />
          ) : (
            <EstimatedDeliveryBanner order={order} shipments={shipments} />
          )}

          {/* The order status (stepper) now lives INSIDE the Order Details card
              on the right (owner annotation), so that card is the first grid
              item: on phones it leads the page, where the full-width stepper
              used to be; from lg it is pinned to column 3, row 1, with the
              address + help cards under it in row 2, while the main column
              spans both rows. grid-rows-[auto_1fr] makes row 2 take any extra
              height so the right column never opens a gap. */}
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
            <div className="lg:col-start-3 lg:row-start-1">
              <OrderDetailsCard order={order} shipments={shipments} showStatus={!isTerminal} />
            </div>

            {/* Main column */}
            <div className="space-y-5 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
              {!isTerminal ? (
                <LiveTrackingCard order={order} shipments={shipments} />
              ) : null}

              {shipments.length > 1 ? (
                <div className="rounded-2xl border border-kraft-200 bg-white px-5 py-5 shadow-box sm:px-6">
                  <ParcelShipments tracking={order?.tracking_number} />
                </div>
              ) : null}

              <OrderItemsCard
                order={order}
                settings={settings}
                refund={isRefundApproved}
              />

              {order?.children?.length > 1 ? (
                <div className="rounded-2xl border border-kraft-200 bg-white px-5 py-5 shadow-box sm:px-6">
                  <h3 className="mb-2 text-base font-medium text-forest-900">Sub Orders</h3>
                  <p className="mb-4 text-[13px] leading-relaxed text-[#8C8A81]">
                    Items from different nurseries ship as their own sub-orders, each
                    with its own status.
                  </p>
                  <SuborderItems
                    items={order?.children}
                    orderStatus={order?.order_status}
                  />
                </div>
              ) : null}

              {order?.note ? (
                <div className="rounded-2xl border border-kraft-200 bg-white px-5 py-5 shadow-box sm:px-6">
                  <h3 className="mb-2 text-base font-medium text-forest-900">Purchase Note</h3>
                  <p className="text-[13px] leading-relaxed text-[#6F6D64]">{order.note}</p>
                </div>
              ) : null}
            </div>

            {/* Right column, under Order Details */}
            <div className="space-y-5 lg:col-start-3 lg:row-start-2">
              <DeliveryAddressCard order={order} />
              <NeedHelpCard settings={settings} />
            </div>
          </div>
        </div>
      </div>

      <UspBand />
    </div>
  );
}

interface Props {
  order: any;
  settings: any;
  loadingStatus?: boolean;
}

const Order: React.FC<Props> = ({ order, settings, loadingStatus }) => {
  return (
    <OrderView order={order} loadingStatus={loadingStatus} settings={settings} />
  );
};

export default Order;
