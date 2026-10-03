import { useState } from 'react';
import classNames from 'classnames';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useTranslation } from 'next-i18next';
import Button from '@/components/ui/button';
import { AddressType } from '@/framework/utils/constants';
import { Building2, Check, Home, MapPin, Pencil, Plus, Trash2 } from '@/components/ui/icon';
import { useUpdateAddressMutation } from '@/framework/user';
import { formatAddress } from '@/lib/format-address';

interface AddressesProps {
  addresses: any[] | undefined;
  label: string;
  className?: string;
  userId: string;
}

const action =
  'inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-[13px] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-btn';

/** One saved address as a compact horizontal row (owner brief: rows, not tall
 *  cards). Profile-only on purpose — checkout keeps its selectable AddressCard. */
function AddressRow({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: any;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const { t } = useTranslation('common');
  const Icon = address?.address_type === 'office' ? Building2 : address?.address_type === 'home' ? Home : MapPin;
  const text = formatAddress(address?.address) ?? '';
  const title = address?.title ?? '';
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-kraft-200 bg-white p-4 transition-colors duration-200 hover:border-forest-200 sm:flex-row sm:items-center sm:gap-4 sm:p-[18px]">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-100 text-forest-700">
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-forest-900">{title}</span>
            {address?.default && (
              <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-semibold text-forest-700">
                {t('text-default')}
              </span>
            )}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13.5px] text-stone-600 sm:line-clamp-1" title={text}>
            {text}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        {!address?.default && (
          <>
            <button
              type="button"
              onClick={onSetDefault}
              aria-label={`${t('account-set-default')}: ${title}`}
              className={classNames(action, 'text-forest-700 hover:bg-sage-50')}
            >
              {t('account-set-default')}
            </button>
            <span aria-hidden className="h-4 w-px bg-kraft-200" />
          </>
        )}
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${t('text-edit')}: ${title}`}
          className={classNames(action, 'text-forest-700 hover:bg-sage-50')}
        >
          <Pencil size={16} aria-hidden />
          {t('text-edit')}
        </button>
        <span aria-hidden className="h-4 w-px bg-kraft-200" />
        <button
          type="button"
          onClick={onDelete}
          aria-label={`${t('text-delete')}: ${title}`}
          className={classNames(action, 'text-red-600 hover:bg-red-50')}
        >
          <Trash2 size={16} aria-hidden />
          {t('text-delete')}
        </button>
      </div>
    </li>
  );
}

type TabKey = 'saved' | 'shipping';

export const ProfileAddressGrid: React.FC<AddressesProps> = ({ addresses, label, className, userId }) => {
  const { openModal } = useModalAction();
  const { t } = useTranslation('common');
  const { mutate: updateAddress, isLoading: isSettingDefault } = useUpdateAddressMutation();
  const [tab, setTab] = useState<TabKey>('saved');

  const list = addresses ?? [];
  // "Saved" = billing + anything untyped (so nothing hides); "Shipping" = shipping rows.
  const saved = list.filter((a) => a?.type !== AddressType.Shipping);
  const shipping = list.filter((a) => a?.type === AddressType.Shipping);
  const tabs: { key: TabKey; label: string; items: any[]; type: AddressType }[] = [
    { key: 'saved', label: t('text-saved-addresses'), items: saved, type: AddressType.Billing },
    { key: 'shipping', label: t('text-shipping-addresses'), items: shipping, type: AddressType.Shipping },
  ];
  const current = tabs.find((x) => x.key === tab)!;

  function onAdd() {
    // New address lands in the tab you're looking at.
    openModal('ADD_OR_UPDATE_ADDRESS', { customerId: userId, type: current.type });
  }
  function onEdit(address: any) {
    openModal('ADD_OR_UPDATE_ADDRESS', {
      customerId: userId,
      address,
      type: (address?.type as AddressType) ?? AddressType.Billing,
    });
  }
  function onDelete(address: any) {
    openModal('DELETE_ADDRESS', { addressId: address?.id });
  }
  function onSetDefault(address: any) {
    if (isSettingDefault || address?.default || !address?.id) return;
    // PUT the full existing row + default:true so validation passes and the
    // server makes it the sole default.
    updateAddress({
      id: address.id,
      title: address?.title,
      type: address?.type,
      address_type: address?.address_type ?? 'home',
      address: { ...address?.address },
      location: address?.location,
      default: true,
    });
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  function onTabKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next: TabKey = tab === 'saved' ? 'shipping' : 'saved';
    setTab(next);
    document.getElementById(`addr-tab-${next}`)?.focus();
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-snug text-forest-900">{label}</h2>
          <p className="mt-1 text-[13.5px] text-stone-500">{t('addresses-subtitle')}</p>
        </div>
        <Button type="button" variant="formSecondary" size="small" className="gap-1.5" onClick={onAdd}>
          <Plus size={16} aria-hidden />
          {t('add-new-address')}
        </Button>
      </div>

      <div role="tablist" aria-label={label} className="mt-5 flex gap-6 border-b border-kraft-200">
        {tabs.map((x) => {
          const active = x.key === tab;
          return (
            <button
              key={x.key}
              type="button"
              role="tab"
              id={`addr-tab-${x.key}`}
              aria-selected={active}
              aria-controls={`addr-panel-${x.key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(x.key)}
              onKeyDown={onTabKey}
              className={classNames(
                '-mb-px border-b-2 pb-3 text-[14px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-btn',
                active
                  ? 'border-forest-700 font-semibold text-forest-700'
                  : 'border-transparent font-medium text-stone-500 hover:text-forest-900',
              )}
            >
              {x.label}
              <span className="ml-1.5 text-[12.5px] font-medium text-stone-400">{x.items.length}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`addr-panel-${tab}`} aria-labelledby={`addr-tab-${tab}`} className="mt-4">
        {current.items.length ? (
          <ul className="flex flex-col gap-3">
            {current.items.map((address) => (
              <AddressRow
                key={address.id}
                address={address}
                onEdit={() => onEdit(address)}
                onDelete={() => onDelete(address)}
                onSetDefault={() => onSetDefault(address)}
              />
            ))}
          </ul>
        ) : tab === 'shipping' && saved.length ? (
          // Checkout's "same as billing" is never persisted as a shipping row, so an
          // empty shipping tab with saved addresses present means exactly that choice.
          <p className="flex items-center gap-2 rounded-xl border border-kraft-200 bg-sage-50 px-4 py-4 text-[13.5px] font-medium text-forest-700">
            <Check size={16} aria-hidden className="shrink-0" />
            {t('text-same-as-billing')}
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-kraft-300 px-4 py-6 text-center text-[13.5px] text-stone-500">
            {t('text-no-address')}
          </p>
        )}
      </div>
    </div>
  );
};
export default ProfileAddressGrid;
