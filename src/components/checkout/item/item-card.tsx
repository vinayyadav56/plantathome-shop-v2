import usePrice from '@/lib/use-price';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { Image } from '@/components/ui/image';
import { siteSettings } from '@/config/site';
interface Props {
  item: any;
  notAvailable?: boolean;
}

const ItemCard = ({ item, notAvailable }: Props) => {
  const { t } = useTranslation('common');
  const { price } = usePrice({
    amount: item.itemTotal,
  });
  return (
    <div className="pa-order-item">
      <div className="pa-order-item-thumb">
        <Image
          src={item?.image ?? siteSettings?.product?.placeholderImage}
          alt={item.name}
          fill
          sizes="44px"
          className="object-cover"
        />
        {item?.quantity > 1 && (
          <span className="pa-order-item-badge">{item.quantity}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          className={cn('pa-order-item-name', notAvailable && 'text-red-500')}
          style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {item.name}
          {item?.in_flash_sale && (
            <span className="ml-1 rounded bg-[#FEE2E2] px-1.5 py-px text-[10px] font-medium text-[#991B1B]">
              SALE
            </span>
          )}
        </span>
        <span className="pa-order-item-qty">
          {item.quantity} × {item.unit}
        </span>
      </div>
      <span
        className={cn('pa-order-item-price', notAvailable && '!text-red-500')}
        style={{ flexShrink: 0, marginLeft: 12 }}
      >
        {!notAvailable ? price : t('text-unavailable')}
      </span>
    </div>
  );
};

export default ItemCard;
