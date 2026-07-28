import { cartAnimation } from '@/lib/cart-animation';
import { useCart } from '@/store/quick-cart/cart.context';
import { generateCartItem } from '@/store/quick-cart/generate-cart-item';
import { track } from '@/lib/analytics/track';
import Link from 'next/link';
import { PlusIconNew } from '@/components/icons/plus-icon';
import { MinusIconNew } from '@/components/icons/minus-icon';
import { useTranslation } from 'next-i18next';
import classNames from 'classnames';
import { useCitySupply } from '@/lib/use-city-supply';
import dynamic from 'next/dynamic';
const AddToCartBtn = dynamic(
  () => import('@/components/products/add-to-cart/add-to-cart-btn'),
  {
    ssr: false,
  }
);
const Counter = dynamic(() => import('@/components/ui/counter'), {
  ssr: false,
});

interface Props {
  data: any;
  variant?:
    | 'helium'
    | 'neon'
    | 'argon'
    | 'oganesson'
    | 'single'
    | 'big'
    | 'text'
    | 'plantathome'
    | 'icon'
    | 'homeMini'
    | 'florine';
  counterVariant?:
    | 'helium'
    | 'neon'
    | 'argon'
    | 'oganesson'
    | 'single'
    | 'details'
    | 'plantathome'
    | 'florine';
  counterClass?: string;
  variation?: any;
  disabled?: boolean;
  /** Units added per click (a card-level quantity stepper feeds this). */
  quantity?: number;
}

export const AddToCart = ({
  data,
  variant = 'helium',
  counterVariant,
  counterClass,
  variation,
  disabled,
  quantity = 1,
}: Props) => {
  const { t } = useTranslation('common');
  const {
    addItemToCart,
    removeItemFromCart,
    isInStock,
    getItemFromCart,
    isInCart,
    updateCartLanguage,
    language,
  } = useCart();
  // Display-only city (no nursery supply): everything is browse-only.
  const { displayOnly } = useCitySupply();
  const item = generateCartItem(data, variation);
  const addToCart = (
    e: React.MouseEvent<HTMLButtonElement | MouseEvent>,
    qty: number
  ) => {
    e.stopPropagation();
    // Check language and update
    if (item?.language !== language) {
      updateCartLanguage(item?.language);
    }
    addItemToCart(item, qty);
    track('add_to_cart', {
      label: item?.name,
      value: Number(item?.price) || undefined,
      meta: { id: item?.id },
    });
    if (!isInCart(item.id)) {
      cartAnimation(e);
    }
  };

  // The card's stepper picks the INITIAL quantity, so the Add button honours it.
  const handleAddClick = (
    e: React.MouseEvent<HTMLButtonElement | MouseEvent>
  ) => addToCart(e, Math.max(1, Math.floor(quantity)));

  // Once the item is in the cart the counter's + must step by exactly one, to
  // mirror its − (which removes one). Reusing the Add handler here made every
  // + add the stepper's quantity again — 3 → 6 → 9 against a − of one.
  const handleIncrementClick = (
    e: React.MouseEvent<HTMLButtonElement | MouseEvent>
  ) => addToCart(e, 1);
  const handleRemoveClick = (e: any) => {
    e.stopPropagation();
    removeItemFromCart(item.id);
  };
  const outOfStock = isInCart(item?.id) && !isInStock(item.id);
  // Guard `status` — related-products/quick-view payloads are slim projections
  // that omit it; `data.status.toLowerCase()` unguarded white-screened every
  // simple-product PDP (Tools/FarmBox). Absent status = treat as publishable.
  const disabledState =
    disabled || outOfStock || (data?.status ? data.status.toLowerCase() !== 'publish' : false);

  // Display-only city: swap every add-to-cart affordance for an Out of Stock
  // pill — the catalog stays browsable, ordering waits for nursery supply.
  if (displayOnly && !isInCart(item?.id)) {
    return (
      <span className="inline-flex cursor-not-allowed items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
        Out of Stock
      </span>
    );
  }

  return !isInCart(item?.id) ? (
    <div>
      {!data?.is_external || !data?.external_product_url ? (
        variant !== 'florine' ? (
          <AddToCartBtn
            disabled={disabledState}
            variant={variant}
            onClick={handleAddClick}
          />
        ) : (
          <div className="flex w-24 items-center justify-between rounded-[0.25rem] border border-[#dbdbdb]">
            <button
              className={classNames(
                'p-2 text-base',
                disabledState || !isInCart(item?.id)
                  ? 'cursor-not-allowed text-[#c1c1c1]'
                  : 'text-accent'
              )}
              disabled={disabledState || !isInCart(item?.id)}
              onClick={handleRemoveClick}
            >
              <span className="sr-only">{t('text-minus')}</span>
              <MinusIconNew />
            </button>
            <div className="text-sm uppercase text-[#666]">Add</div>
            <button
              className={classNames(
                'p-2 text-base',
                disabledState
                  ? 'cursor-not-allowed text-[#c1c1c1]'
                  : 'text-accent'
              )}
              disabled={disabledState}
              onClick={handleAddClick}
            >
              <span className="sr-only">{t('text-plus')}</span>
              <PlusIconNew />
            </button>
          </div>
        )
      ) : (
        <Link
          href={data?.external_product_url}
          target="_blank"
          className="inline-flex h-10 !shrink items-center justify-center rounded border border-transparent bg-accent px-5 py-0 text-sm font-semibold leading-none text-light outline-none transition duration-300 ease-in-out hover:bg-accent-hover focus:shadow focus:outline-0 focus:ring-1 focus:ring-accent-700"
        >
          {data?.external_product_button_text}
        </Link>
      )}
    </div>
  ) : (
    <>
      <Counter
        value={getItemFromCart(item.id).quantity as number}
        onDecrement={handleRemoveClick}
        onIncrement={handleIncrementClick}
        variant={(counterVariant || variant) as any}
        className={counterClass}
        disabled={outOfStock || displayOnly}
      />
    </>
  );
};
