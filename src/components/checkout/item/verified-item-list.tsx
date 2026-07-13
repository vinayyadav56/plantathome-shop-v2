import Coupon from '@/components/checkout/coupon';
import usePrice from '@/lib/use-price';
import EmptyCartIcon from '@/components/icons/empty-cart';
import { CloseIcon } from '@/components/icons/close-icon';
import { useTranslation } from 'next-i18next';
import { useCart } from '@/store/quick-cart/cart.context';
import {
  calculatePaidTotal,
  calculateTotal,
} from '@/store/quick-cart/cart.utils';
import { useAtom } from 'jotai';
import {
  couponAtom,
  discountAtom,
  payableAmountAtom,
  verifiedResponseAtom,
  walletAtom,
} from '@/store/checkout';
import ItemCard from '@/components/checkout/item/item-card';
import { ItemInfoRow } from '@/components/checkout/item/item-info-row';
import PaymentGrid from '@/components/checkout/payment/payment-grid';
import { PlaceOrderAction } from '@/components/checkout/place-order-action';
import Wallet from '@/components/checkout/wallet/wallet';
import { useSettings } from '@/framework/settings';
import cn from 'classnames';
import { CouponType } from '@/types';

interface Props {
  className?: string;
}
const VerifiedItemList: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation('common');
  const { items, isEmpty: isEmptyCart } = useCart();
  const [verifiedResponse] = useAtom(verifiedResponseAtom);
  const [coupon, setCoupon] = useAtom(couponAtom);
  const [discount] = useAtom(discountAtom);
  const [payableAmount] = useAtom(payableAmountAtom);
  const [use_wallet] = useAtom(walletAtom);
  const { settings } = useSettings();
  const freeShippingAmount = settings?.freeShippingAmount;
  const freeShipping = settings?.freeShipping;

  const available_items = items?.filter(
    (item) => !verifiedResponse?.unavailable_products?.includes(item.id)
  );

  const { price: tax } = usePrice(
    verifiedResponse && {
      amount: verifiedResponse.total_tax ?? 0,
    }
  );

  const { price: shipping } = usePrice(
    verifiedResponse && {
      amount: verifiedResponse.shipping_charge ?? 0,
    }
  );
  const base_amount = calculateTotal(available_items);
  const { price: sub_total } = usePrice(
    verifiedResponse && {
      amount: base_amount,
    }
  );
  // Calculate Discount base on coupon type
  let calculateDiscount = 0;

  switch (coupon?.type) {
    case CouponType.PERCENTAGE:
      calculateDiscount = (base_amount * Number(discount)) / 100
      break;
    case CouponType.FREE_SHIPPING:
      calculateDiscount =  verifiedResponse ? verifiedResponse.shipping_charge : 0
      break;
    default:
      calculateDiscount = Number(discount)
  }

  const { price: discountPrice } = usePrice(
    //@ts-ignore
    discount && {
      amount: Number(calculateDiscount),
    }
  );
  let freeShippings = freeShipping && Number(freeShippingAmount) <= base_amount
  const totalPrice = verifiedResponse
    ? calculatePaidTotal(
      {
        totalAmount: base_amount,
        tax: verifiedResponse?.total_tax,
        shipping_charge: freeShippings ? 0 : verifiedResponse?.shipping_charge,
      },
      Number(calculateDiscount)
    )
    : 0;
  const { price: total } = usePrice(
    verifiedResponse && {
      amount: totalPrice,
    }
  );
  return (
    <div className={cn('pa-order-summary', className)}>
      <h3 className="pa-order-summary-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C5F2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
        {t('text-your-order')}
      </h3>

      <div style={{ marginBottom: 12 }}>
        {!isEmptyCart ? (
          items?.map((item) => {
            const notAvailable = verifiedResponse?.unavailable_products?.find(
              (d: any) => d === item.id
            );
            return (
              <ItemCard
                item={item}
                key={item.id}
                notAvailable={!!notAvailable}
              />
            );
          })
        ) : (
          <EmptyCartIcon />
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(46,107,74,0.10)', paddingTop: 12 }}>
        <div className="pa-order-row">
          <span>{t('text-sub-total')}</span>
          <span style={{ fontWeight: 600, color: '#2E6B4A' }}>{sub_total}</span>
        </div>
        <div className="pa-order-row">
          <span>{t('text-tax')}</span>
          <span>{tax}</span>
        </div>
        <div className="pa-order-row">
          <span>
            {t('text-shipping')}
            {freeShippings && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2E6B4A', marginLeft: 4 }}>
                (FREE)
              </span>
            )}
          </span>
          <span style={{ color: freeShippings ? '#2E6B4A' : undefined }}>
            {freeShippings ? '₹0' : shipping}
          </span>
        </div>

        {discount && coupon ? (
          <div className="pa-order-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {t('text-discount')}
              <span style={{ fontSize: 11, color: '#2E6B4A', fontWeight: 600 }}>
                ({coupon?.code})
              </span>
              <button onClick={() => setCoupon(null)} style={{ color: '#E53E3E', marginLeft: 2, lineHeight: 1 }}>
                <CloseIcon className="w-3 h-3" />
              </button>
            </span>
            <span style={{ color: '#E53E3E', fontWeight: 600 }}>
              {calculateDiscount > 0 ? '-' : ''}{discountPrice}
            </span>
          </div>
        ) : (
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <Coupon subtotal={base_amount} />
          </div>
        )}

        <div className="pa-order-total">
          <span>{t('text-total')}</span>
          <span>{total}</span>
        </div>
      </div>

      {verifiedResponse && (
        <Wallet
          totalPrice={totalPrice}
          walletAmount={verifiedResponse.wallet_amount}
          walletCurrency={verifiedResponse.wallet_currency}
        />
      )}
      {use_wallet && !Boolean(payableAmount) ? null : (
        <PaymentGrid className="pa-payment-grid" />
      )}
      <PlaceOrderAction>{t('text-place-order')}</PlaceOrderAction>
    </div>
  );
};

export default VerifiedItemList;
