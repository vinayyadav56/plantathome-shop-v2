import { useCart } from '@/store/quick-cart/cart.context';
import { useTranslation } from 'next-i18next';
import ItemCard from './item-card';
import EmptyCartIcon from '@/components/icons/empty-cart';
import usePrice from '@/lib/use-price';
import { ItemInfoRow } from './item-info-row';
import { CheckAvailabilityAction } from '@/components/checkout/check-availability-action';

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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C5F2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
          </svg>
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Secure
        </span>
        <span className="pa-od-trust-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Encrypted
        </span>
        <span className="pa-od-trust-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Easy returns
        </span>
      </div>
    </div>
  );
};
export default UnverifiedItemList;
