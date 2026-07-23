import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useCart } from '@/store/quick-cart/cart.context';
import { clearCheckoutAtom } from '@/store/checkout';
import { useOrderShipments } from '@/framework/order';
import { OrderStatus, RefundStatus } from '@/types';
import SuborderItems from '@/components/orders/suborder-items';
import ParcelShipments from '@/components/orders/parcel-shipments';
import TrackingHero from '@/components/orders/tracking/tracking-hero';
import OrderSummaryCard from '@/components/orders/tracking/order-summary-card';
import TrackingStepper from '@/components/orders/tracking/tracking-stepper';
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
    <div className="rounded-2xl border border-[#F0D9D9] bg-[#FBF1F1] px-6 py-5 text-center">
      <p className="text-[15px] font-semibold text-[#B23B3B]">{copy.title}</p>
      <p className="mt-1 text-[13px] text-[#8C6A6A]">{copy.text}</p>
    </div>
  );
}

function OrderView({ order, settings, loadingStatus }: any) {
  const { resetCart } = useCart();
  const [, resetCheckout] = useAtom(clearCheckoutAtom);

  useEffect(() => {
    resetCart();
    //@ts-ignore
    resetCheckout();
  }, [resetCart, resetCheckout]);

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
            <>
              <TrackingStepper order={order} shipments={shipments} />
              <EstimatedDeliveryBanner order={order} shipments={shipments} />
            </>
          )}

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-5 lg:col-span-2">
              {!isTerminal ? (
                <LiveTrackingCard order={order} shipments={shipments} />
              ) : null}

              {shipments.length > 1 ? (
                <div className="rounded-2xl border border-[#E7E5DC] bg-white px-5 py-5 shadow-sm sm:px-6">
                  <ParcelShipments tracking={order?.tracking_number} />
                </div>
              ) : null}

              <OrderItemsCard
                order={order}
                settings={settings}
                refund={isRefundApproved}
              />

              {order?.children?.length > 1 ? (
                <div className="rounded-2xl border border-[#E7E5DC] bg-white px-5 py-5 shadow-sm sm:px-6">
                  <h3 className="mb-2 text-base font-semibold text-forest-900">Sub Orders</h3>
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
                <div className="rounded-2xl border border-[#E7E5DC] bg-white px-5 py-5 shadow-sm sm:px-6">
                  <h3 className="mb-2 text-base font-semibold text-forest-900">Purchase Note</h3>
                  <p className="text-[13px] leading-relaxed text-[#6F6D64]">{order.note}</p>
                </div>
              ) : null}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <OrderDetailsCard order={order} />
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
