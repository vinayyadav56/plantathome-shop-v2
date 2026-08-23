import usePrice from '@/lib/use-price';
import cn from 'classnames';
import { useTranslation } from 'next-i18next';
import { Image } from '@/components/ui/image';
import { siteSettings } from '@/config/site';
interface Props {
  item: any;
  notAvailable?: boolean;
  /** When set, an unavailable line renders a Remove control wired to this. */
  onRemove?: () => void;
}

const ItemCard = ({ item, notAvailable, onRemove }: Props) => {
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
          {/* Boolean(), not a bare &&: in_flash_sale is the INTEGER 0/1 from the API, and
              `0 && <jsx>` renders the literal 0 — every line read "Monstera - Small0". */}
          {Boolean(item?.in_flash_sale) && (
            <span className="ml-1 rounded bg-[#FEE2E2] px-1.5 py-px text-[10px] font-medium text-[#991B1B]">
              SALE
            </span>
          )}
        </span>
        <span className="pa-order-item-qty">
          {item.quantity} × {item.unit}
        </span>
        {notAvailable && (
          <span className="mt-0.5 block text-[11px] leading-snug text-red-400">
            {t('text-unavailable-item-reason')}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="ml-1.5 font-semibold text-red-500 underline underline-offset-2 hover:text-red-600"
              >
                {t('text-remove')}
              </button>
            )}
          </span>
        )}
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
