import { PlusIcon } from '@/components/icons/plus-icon';
import CartIcon from '@/components/icons/cart';
import { useTranslation } from 'next-i18next';
import cn from 'classnames';
import { PlusIconNew } from '@/components/icons/plus-icon';

type Props = {
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
    | 'homeMini';
  onClick(event: React.MouseEvent<HTMLButtonElement | MouseEvent>): void;
  disabled?: boolean;
};

const AddToCartBtn: React.FC<Props> = ({ variant, onClick, disabled }) => {
  const { t } = useTranslation('common');

  switch (variant) {
    case 'neon':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className="group flex h-7 w-full items-center justify-between rounded bg-gray-100 text-xs text-body-dark transition-colors hover:border-accent hover:bg-accent hover:text-light focus:border-accent focus:bg-accent focus:text-light focus:outline-0 md:h-9 md:text-sm"
        >
          <span className="flex-1">{t('text-add')}</span>
          <span className="grid h-7 w-7 place-items-center bg-gray-200 transition-colors duration-200 group-hover:bg-accent-600 group-focus:bg-accent-600 ltr:rounded-tr ltr:rounded-br rtl:rounded-tl rtl:rounded-bl md:h-9 md:w-9">
            <PlusIcon className="h-4 w-4 stroke-2" />
          </span>
        </button>
      );
    case 'argon':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className="flex h-7 w-7 items-center justify-center rounded border border-border-200 bg-light text-sm text-heading transition-colors hover:border-accent hover:bg-accent hover:text-light focus:border-accent focus:bg-accent focus:text-light focus:outline-0 md:h-9 md:w-9"
        >
          <PlusIcon className="h-5 w-5 stroke-2" />
        </button>
      );
    case 'oganesson':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm text-light shadow-500 transition-colors hover:border-accent hover:bg-accent hover:text-light focus:border-accent focus:bg-accent focus:text-light focus:outline-0 md:h-10 md:w-10"
        >
          <span className="sr-only">{t('text-plus')}</span>
          <PlusIcon className="h-5 w-5 stroke-2 md:h-6 md:w-6" />
        </button>
      );
    case 'single':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className="pa-add-btn order-5 sm:order-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ltr:mr-1.5 rtl:ml-1.5 shrink-0">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <span>{t('text-add')}</span>
        </button>
      );
    case 'big':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-center rounded bg-ds-accent py-4 px-5 text-sm font-light text-light transition duration-300 hover:brightness-110 focus:outline-0 lg:text-base',
            {
              'cursor-not-allowed border border-border-400 !bg-gray-300 !text-body hover:!bg-gray-300':
                disabled,
            }
          )}
        >
          <span>{t('text-add-cart')}</span>
        </button>
      );
    case 'plantathome':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            // Sized in cqw against the CARD, like everything else inside it.
            // Fixed h-12/16px/px-4 was built for a full-width mobile card; in a
            // two-up grid "Add To Shopping Cart" burst straight out of the card.
            // The clamp bounds keep it sane if this ever renders outside a
            // container, where cqw falls back to the viewport.
            'flex h-[clamp(38px,12.4cqw,48px)] w-full min-w-0 items-center justify-center gap-[clamp(4px,1.8cqw,10px)] rounded-[14px] bg-[#14532D] px-[clamp(6px,2.6cqw,16px)] text-[clamp(11px,4.2cqw,18px)] font-semibold leading-none text-white transition duration-300 hover:bg-[#0D4324] focus:outline-0',
            {
              'cursor-not-allowed !bg-stone-300 !text-stone-500 hover:!bg-stone-300':
                disabled,
            }
          )}
        >
          <CartIcon className="h-[clamp(13px,4.4cqw,18px)] w-[clamp(13px,4.4cqw,18px)] shrink-0" />
          <span className="truncate">{t('text-add-cart')}</span>
        </button>
      );
    case 'homeMini':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={t('text-add-cart')}
          title={t('text-add-cart')}
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ds-btn text-white transition duration-200 hover:bg-ds-btn-hover focus:outline-0',
            { 'cursor-not-allowed !bg-stone-300': disabled }
          )}
        >
          <CartIcon className="h-4 w-4" />
        </button>
      );
    case 'icon':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={t('text-add-cart')}
          title={t('text-add-cart')}
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ds-accent text-white shadow-[0_8px_20px_-8px_rgba(46,94,42,0.7)] transition duration-200 hover:brightness-110 focus:outline-0',
            { 'cursor-not-allowed !bg-stone-300': disabled }
          )}
        >
          <CartIcon className="h-[18px] w-[18px]" />
        </button>
      );
    case 'text':
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'whitespace-nowrap text-sm font-semibold text-accent hover:text-accent-hover hover:underline',
            {
              'text-gray-300 hover:text-gray-300': disabled,
            }
          )}
        >
          <span>{t('text-add-to-cart')}</span>
        </button>
      );
    default:
      return (
        <button
          onClick={onClick}
          disabled={disabled}
          title={disabled ? 'Out Of Stock' : ''}
          className="flex h-7 w-7 items-center justify-center rounded border border-border-200 bg-light text-sm text-accent transition-colors hover:border-accent hover:bg-accent hover:text-light focus:border-accent focus:bg-accent focus:text-light focus:outline-0 md:h-9 md:w-9"
        >
          <span className="sr-only">{t('text-plus')}</span>
          <PlusIcon className="h-5 w-5 stroke-2" />
        </button>
      );
  }
};

export default AddToCartBtn;
