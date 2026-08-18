import { useTranslation } from 'next-i18next';
import OrderCard from './order-card';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import type { Order } from '@/types';

const selectedOrderAtom = atom<Order | null>(null);
export function useSelectedOrder() {
  return useAtom(selectedOrderAtom);
}

/**
 * The list column of the split view. A plain flex column — the old version pinned
 * itself to `h-[80vh] min-h-[670px]` and gave the scrollbar `calc(100% - 80px)`,
 * a magic number that assumed the exact heading padding; restyling the heading
 * would have silently broken the scroll area.
 */
export default function OrderList({
  orders,
  hasMore,
  isLoadingMore,
  loadMore,
}: {
  orders: Order[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
}) {
  const { t } = useTranslation('common');
  const [selectedOrder, setSelectedOrder] = useSelectedOrder();
  useEffect(() => {
    if (!selectedOrder && orders.length) {
      setSelectedOrder(orders[0]);
    }
  }, [orders, selectedOrder, setSelectedOrder]);

  return (
    <div className="w-full shrink-0 lg:w-[320px]">
      <div className="max-h-[75vh] overflow-y-auto pr-1 lg:pr-2">
        {orders.map((order: any, index: number) => (
          <OrderCard
            key={index}
            order={order}
            onClick={() => setSelectedOrder(order)}
            isActive={order?.id === selectedOrder?.id}
          />
        ))}
        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoadingMore}
              className="pa-btn pa-btn-secondary pa-btn-sm disabled:cursor-wait disabled:opacity-60"
            >
              {isLoadingMore ? t('text-loading') : t('text-load-more')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
