import type { Order } from '@/types';
import { useTranslation } from 'next-i18next';
import Collapse from 'rc-collapse';
import 'rc-collapse/assets/index.css';
import OrderCard from './order-card';
import { useSelectedOrder } from './order-list';
import SelectedOrderDetails from './selected-order-details';

interface OrdersWithLoaderProps {
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  orders: Order[];
  loadingStatus?: boolean;
}

const OrderListMobile: React.FC<OrdersWithLoaderProps> = ({
  hasNextPage,
  isLoadingMore,
  onLoadMore,
  orders,
  loadingStatus
}) => {
  const { t } = useTranslation('common');
  const [selectedOrder, setSelectedOrder] = useSelectedOrder();

  return (
    <div className="flex w-full flex-col lg:hidden">
      <div className="flex h-full w-full flex-col px-0 pb-5">
        <h1 className="pb-5 font-pahserif text-2xl font-medium text-forest-900">{t('profile-sidebar-orders')}</h1>
        <Collapse accordion={true} expandIcon={() => null}>
          {orders.map((order, index: number) => (
            <Collapse.Panel
              header={
                <OrderCard
                  key={`mobile_${index}`}
                  order={order}
                  onClick={() => setSelectedOrder(order)}
                  isActive={order?.id === selectedOrder?.id}
                />
              }
              key={index}
              className="mb-4"
            >
              {selectedOrder && (
                <SelectedOrderDetails
                  selected={selectedOrder}
                  listOrder={orders.find(({ id }) => id === selectedOrder.id)}
                  loadingStatus={loadingStatus}
                />
              )}
            </Collapse.Panel>
          ))}
        </Collapse>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <button type="button"
                onClick={onLoadMore}
              disabled={isLoadingMore}
                className="pa-btn pa-btn-secondary pa-btn-sm disabled:cursor-wait disabled:opacity-60"
              >
                {t('text-load-more')}
              </button>
            </div>
          )}

      </div>
    </div>
  );
};

export default OrderListMobile;
