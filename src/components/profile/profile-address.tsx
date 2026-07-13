import { useModalAction } from '@/components/ui/modal/modal.context';
import AddressCard from '@/components/address/address-card';
import { useTranslation } from 'next-i18next';
import { AddressType } from '@/framework/utils/constants';

interface AddressesProps {
  addresses: any[] | undefined;
  label: string;
  className?: string;
  userId: string;
}

/** One address type group (Billing or Shipping) — labelled, with the first
 *  entry marked Default (display-only; there's no is_default flag in data). */
function AddressGroup({
  title,
  items,
  userId,
  onEdit,
  onDelete,
  emptyText,
}: {
  title: string;
  items: any[];
  userId: string;
  onEdit: (a: any, type: AddressType) => void;
  onDelete: (a: any) => void;
  emptyText: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-forest-800">{title}</p>
      {items.length ? (
        <div className="flex flex-col gap-4">
          {items.map((address, i) => (
            <AddressCard
              key={address.id}
              checked={false}
              address={address}
              userId={userId}
              defaultBadge={i === 0}
              onEdit={() => onEdit(address, (address?.type as AddressType) ?? AddressType.Billing)}
              onDelete={() => onDelete(address)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-forest-900/15 px-4 py-6 text-[13px] text-stone-400">
          {emptyText}
        </p>
      )}
    </div>
  );
}

export const ProfileAddressGrid: React.FC<AddressesProps> = ({
  addresses,
  label,
  className,
  userId,
}) => {
  const { openModal } = useModalAction();
  const { t } = useTranslation('common');

  const list = addresses ?? [];
  const billing = list.filter((a) => a?.type === AddressType.Billing);
  const shipping = list.filter((a) => a?.type === AddressType.Shipping);
  // Addresses without a type fall back into the billing column so nothing hides.
  const untyped = list.filter((a) => a?.type !== AddressType.Billing && a?.type !== AddressType.Shipping);

  function onAdd() {
    openModal('ADD_OR_UPDATE_ADDRESS', { customerId: userId, type: AddressType.Billing });
  }
  function onEdit(address: any, type: AddressType) {
    openModal('ADD_OR_UPDATE_ADDRESS', { customerId: userId, address, type });
  }
  function onDelete(address: any) {
    openModal('DELETE_ADDRESS', { addressId: address?.id });
  }

  return (
    <div className={className}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-bold text-forest-900">{label}</h3>
          <p className="text-[13px] text-stone-500">{t('addresses-subtitle')}</p>
        </div>
        <button
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-forest-700 transition-colors hover:text-forest-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
          {t('add-new-address')}
        </button>
      </div>

      {list.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AddressGroup title={t('billing-address')} items={[...billing, ...untyped]} userId={userId} onEdit={onEdit} onDelete={onDelete} emptyText={t('text-no-address')} />
          <AddressGroup title={t('shipping-address')} items={shipping} userId={userId} onEdit={onEdit} onDelete={onDelete} emptyText={t('text-no-address')} />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-forest-900/15 px-5 py-8 text-center text-[13px] text-stone-400">
          {t('text-no-address')}
        </p>
      )}
    </div>
  );
};
export default ProfileAddressGrid;
