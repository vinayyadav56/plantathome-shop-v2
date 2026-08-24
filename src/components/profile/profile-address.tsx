import { useModalAction } from '@/components/ui/modal/modal.context';
import AddressCard from '@/components/address/address-card';
import { useTranslation } from 'next-i18next';
import { AddressType } from '@/framework/utils/constants';
import { Check, Plus } from '@/components/ui/icon';
import { useUpdateAddressMutation } from '@/framework/user';

interface AddressesProps {
  addresses: any[] | undefined;
  label: string;
  className?: string;
  userId: string;
}

/** One address type group (Billing or Shipping) — labelled, showing the real
 *  server-side `address.default` flag with a per-card "Set as default" action. */
function AddressGroup({
  title,
  items,
  userId,
  onEdit,
  onDelete,
  onSetDefault,
  emptyText,
  sameAsText,
}: {
  title: string;
  items: any[];
  userId: string;
  onEdit: (a: any, type: AddressType) => void;
  onDelete: (a: any) => void;
  onSetDefault: (a: any) => void;
  emptyText: string;
  /** Shown instead of the empty state when this group mirrors the other one. */
  sameAsText?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-forest-800">{title}</p>
      {items.length ? (
        <div className="flex flex-col gap-4">
          {items.map((address) => (
            <AddressCard
              key={address.id}
              checked={false}
              address={address}
              userId={userId}
              defaultBadge={Boolean(address?.default)}
              onSetDefault={() => onSetDefault(address)}
              onEdit={() => onEdit(address, (address?.type as AddressType) ?? AddressType.Billing)}
              onDelete={() => onDelete(address)}
            />
          ))}
        </div>
      ) : sameAsText ? (
        <p className="flex items-center gap-2 rounded-xl border border-forest-900/15 bg-sage-50 px-4 py-6 text-[13px] font-medium text-forest-700">
          <Check size={16} aria-hidden className="shrink-0" />
          {sameAsText}
        </p>
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
  const { mutate: updateAddress, isLoading: isSettingDefault } =
    useUpdateAddressMutation();

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

  return (
    <div className={className}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-medium text-forest-900">{label}</h3>
          <p className="text-[13px] text-stone-500">{t('addresses-subtitle')}</p>
        </div>
        <button
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-forest-700 transition-colors hover:text-forest-900"
        >
          <Plus size={16} aria-hidden />
          {t('add-new-address')}
        </button>
      </div>

      {list.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AddressGroup title={t('billing-address')} items={[...billing, ...untyped]} userId={userId} onEdit={onEdit} onDelete={onDelete} onSetDefault={onSetDefault} emptyText={t('text-no-address')} />
          {/* Checkout's "same as billing" is never persisted as a shipping row, so an
              empty shipping column with billing present means exactly that choice. */}
          <AddressGroup
            title={t('shipping-address')}
            items={shipping}
            userId={userId}
            onEdit={onEdit}
            onDelete={onDelete}
            onSetDefault={onSetDefault}
            emptyText={t('text-no-address')}
            sameAsText={billing.length || untyped.length ? t('text-same-as-billing') : undefined}
          />
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
