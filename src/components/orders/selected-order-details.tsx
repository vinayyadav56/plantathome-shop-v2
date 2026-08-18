import OrderDetails from '@/components/orders/order-details';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import { useOrder } from '@/framework/order';

/**
 * The details pane fetches the FULL order instead of reusing the list row.
 *
 * The orders LIST endpoint deliberately slims every row — products become bare `[{id}]`,
 * addresses are hidden — so the response can never truncate (the admin table only needs
 * counts, and its detail page loads the single order). Rendering the slimmed row directly
 * made OrderItems read `pivot.order_quantity` off a product with no pivot, throw, and the
 * error boundary replaced the customer's ENTIRE order history with "This page didn't load".
 * Fetching by tracking number returns the complete record — the same endpoint the
 * standalone order page uses. Desktop and mobile both render through this.
 */
export default function SelectedOrderDetails({
  selected,
  listOrder,
  loadingStatus,
}: {
  selected: any;
  listOrder: any;
  loadingStatus?: boolean;
}) {
  const trackingNumber = String(
    listOrder?.tracking_number ?? selected?.tracking_number ?? '',
  );
  const { order, isLoading } = useOrder({ tracking_number: trackingNumber });

  if (isLoading || !order) {
    return (
      <div className="flex w-full items-center justify-center p-8 md:w-2/3">
        <Spinner simple className="h-10 w-10" />
      </div>
    );
  }

  return <OrderDetails order={order} loadingStatus={loadingStatus} />;
}
