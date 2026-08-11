import Coupon from '@/components/checkout/coupon';
import usePrice from '@/lib/use-price';
import EmptyCartIcon from '@/components/icons/empty-cart';
import { CloseIcon } from '@/components/icons/close-icon';
import { useTranslation } from 'next-i18next';
import { useCart } from '@/store/quick-cart/cart.context';
import { calculateTotal } from '@/store/quick-cart/cart.utils';
import { computeCheckoutTotals } from '@/lib/checkout-totals';
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
import { ShoppingBag } from '@/components/ui/icon';
import cn from 'classnames';

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

  // ONE totals computation, shared verbatim with PlaceOrderAction — what this summary
  // shows is exactly what gets submitted (percentage coupons, free shipping and all).
  const totals = computeCheckoutTotals({
    clientSubtotal: calculateTotal(available_items),
    verifiedAmount: verifiedResponse?.amount,
    totalTax: verifiedResponse?.total_tax,
    shippingCharge: verifiedResponse?.shipping_charge,
    coupon,
    freeShippingEnabled: freeShipping,
    freeShippingAmount,
  });
  const freeShippings = totals.freeShipping;
  const calculateDiscount = totals.discount;
  const totalPrice = verifiedResponse ? totals.total : 0;

  const { price: tax } = usePrice(
    verifiedResponse && { amount: totals.tax }
  );
  const { price: shipping } = usePrice(
    verifiedResponse && { amount: verifiedResponse.shipping_charge ?? 0 }
  );
  const { price: sub_total } = usePrice(
    verifiedResponse && { amount: totals.subtotal }
  );
  const { price: discountPrice } = usePrice(
    //@ts-ignore
    discount && { amount: totals.discount }
  );
  const { price: total } = usePrice(
    verifiedResponse && { amount: totalPrice }
  );
  return (
    <div className={cn('pa-order-summary', className)}>
      <h3 className="pa-order-summary-title">
        <ShoppingBag size={16} className="text-[#2C5F2E]" aria-hidden />
        {t('text-your-order')}
      </h3>

      <div className="mb-3">
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

      <div className="border-t border-[#2E6B4A]/10 pt-3">
        <div className="pa-order-row">
          <span>{t('text-sub-total')}</span>
          <span className="font-semibold text-[#2E6B4A]">{sub_total}</span>
        </div>
        <div className="pa-order-row">
          <span>{t('text-tax')}</span>
          <span>{tax}</span>
        </div>
        <div className="pa-order-row">
          <span>
            {t('text-shipping')}
            {freeShippings && (
              <span className="ml-1 text-xs font-bold text-[#2E6B4A]">(FREE)</span>
            )}
          </span>
          <span className={cn(freeShippings && 'text-[#2E6B4A]')}>
            {freeShippings ? '₹0' : shipping}
          </span>
        </div>

        {discount && coupon ? (
          <div className="pa-order-row">
            <span className="flex items-center gap-1">
              {t('text-discount')}
              <span className="text-xs font-semibold text-[#2E6B4A]">
                ({coupon?.code})
              </span>
              <button onClick={() => setCoupon(null)} className="ml-0.5 leading-none text-[#E53E3E]">
                <CloseIcon className="w-3 h-3" />
              </button>
            </span>
            <span className="font-semibold text-[#E53E3E]">
              {calculateDiscount > 0 ? '-' : ''}{discountPrice}
            </span>
          </div>
        ) : (
          <div className="mt-2 mb-1">
            <Coupon subtotal={totals.subtotal} />
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
