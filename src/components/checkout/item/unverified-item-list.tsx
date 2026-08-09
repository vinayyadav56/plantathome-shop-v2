import { useCart } from '@/store/quick-cart/cart.context';
import { useTranslation } from 'next-i18next';
import ItemCard from './item-card';
import EmptyCartIcon from '@/components/icons/empty-cart';
import usePrice from '@/lib/use-price';
import { ItemInfoRow } from './item-info-row';
import { CheckAvailabilityAction } from '@/components/checkout/check-availability-action';
import { ShoppingBag, Lock, ShieldCheck, RotateCcw } from '@/components/ui/icon';

const FREE_DELIVERY_THRESHOLD = 999;

const UnverifiedItemList = ({ hideTitle = false }: { hideTitle?: boolean }) => {
  const { t } = useTranslation('common');
  const { items, total, isEmpty } = useCart();
  const { price: subtotal } = usePrice(
    items && {
      amount: total,
    }
  );
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total);
  const { price: remainingPrice } = usePrice({ amount: remaining });
  const shipProgress = Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100);
  const isFreeDelivery = total >= FREE_DELIVERY_THRESHOLD;
  return (
    <div className="pa-order-summary">
      {!hideTitle && (
        <h3 className="pa-order-summary-title">
          <ShoppingBag size={16} style={{ color: '#2C5F2E' }} aria-hidden />
          {t('text-your-order')}
        </h3>
      )}

      {!isEmpty && (
        <div className={`pa-od-ship${isFreeDelivery ? ' is-free' : ''}`}>
          <p className="pa-od-ship-label">
            {isFreeDelivery
              ? '🎉 You’ve unlocked FREE delivery!'
              : `Add ${remainingPrice} more for FREE delivery`}
          </p>
          <div className="pa-od-ship-track">
            <div className="pa-od-ship-fill" style={{ width: `${shipProgress}%` }} />
          </div>
        </div>
      )}
      {isEmpty ? (
        <div className="pa-empty-state" style={{ padding: '32px 0' }}>
          <EmptyCartIcon width={100} height={120} />
          <p className="pa-empty-state-sub" style={{ marginTop: 12 }}>
            {t('text-no-products')}
          </p>
        </div>
      ) : (
        items?.map((item) => <ItemCard item={item} key={item.id} />)
      )}
      <div className="mt-3">
        <div className="pa-order-row">
          <span>{t('text-sub-total')}</span>
          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{subtotal}</span>
        </div>
        <div className="pa-order-row">
          <span>{t('text-tax')}</span>
          <span>{t('text-calculated-checkout')}</span>
        </div>
        <div className="pa-order-row">
          <span>{t('text-estimated-shipping')}</span>
          <span>{t('text-calculated-checkout')}</span>
        </div>
      </div>
      <CheckAvailabilityAction>
        {t('text-check-availability')}
      </CheckAvailabilityAction>

      <div className="pa-od-trust">
        <span className="pa-od-trust-item">
          <Lock size={14} aria-hidden />
          Secure
        </span>
        <span className="pa-od-trust-item">
          <ShieldCheck size={14} aria-hidden />
          Encrypted
        </span>
        <span className="pa-od-trust-item">
          <RotateCcw size={14} aria-hidden />
          Easy returns
        </span>
      </div>
    </div>
  );
};
export default UnverifiedItemList;
