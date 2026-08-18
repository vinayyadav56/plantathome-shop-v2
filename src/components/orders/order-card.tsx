import usePrice from '@/lib/use-price';
import dayjs from 'dayjs';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { PILL_BASE, statusPill } from './status-pill';

type OrderCardProps = {
  order: any;
  isActive: boolean;
  onClick?: (e: any) => void;
};

/**
 * House card, not the legacy grey slab: white surface, kraft border, 16px radius,
 * status as the shared account-area pill. Weight and colour carry hierarchy —
 * the order number is the strongest thing on the card, labels stay quiet.
 */
const OrderCard: React.FC<OrderCardProps> = ({ onClick, order, isActive }) => {
  const { t } = useTranslation('common');
  const { id, order_status, created_at } = order;
  const { price: total } = usePrice({
    amount: order?.total,
  });

  return (
    <div
      onClick={onClick}
      role="button"
      className={cn(
        'mb-3 flex w-full shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-colors last:mb-0',
        isActive
          ? 'border-[var(--ds-accent,#4E8B31)] ring-1 ring-[var(--ds-accent,#4E8B31)]'
          : 'border-kraft-200 hover:border-forest-900/25',
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-kraft-200 px-4 py-3">
        <span className="shrink-0 text-sm font-semibold text-forest-900">
          {t('text-order')} <span className="font-normal text-stone-500">#{id}</span>
        </span>
        <span
          className={cn(PILL_BASE, statusPill(order_status), 'max-w-full truncate')}
          title={t(order_status)}
        >
          {t(order_status)}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 px-4 py-3.5">
        <p className="flex items-baseline justify-between gap-3 text-[13px]">
          <span className="text-stone-500">{t('text-order-date')}</span>
          <span className="text-forest-900">{dayjs(created_at).format('MMM D, YYYY')}</span>
        </p>
        <p className="flex items-baseline justify-between gap-3 text-[13px]">
          <span className="text-stone-500">{t('text-total-price')}</span>
          <span className="text-sm font-semibold text-forest-900">{total}</span>
        </p>
      </div>
    </div>
  );
};

export default OrderCard;
