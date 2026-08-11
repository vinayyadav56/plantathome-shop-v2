import type { Address } from '@/types';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { RadioGroup } from '@headlessui/react';
import { useAtom, WritableAtom } from 'jotai';
import AddressCard from '@/components/address/address-card';
import { AddressHeader } from '@/components/address/address-header';
import { useTranslation } from 'next-i18next';
import { addressCityOf, normalizeCityClient } from '@/lib/shopping-city';
import { getStoredCity } from '@/lib/customer-location';

interface AddressesProps {
  addresses: Address[] | undefined;
  label: string;
  atom: WritableAtom<Address | null, any, Address>;
  className?: string;
  count: number;
  type: string;
}

export const GuestAddressGrid: React.FC<AddressesProps> = ({
  addresses,
  label,
  atom,
  className,
  count,
  type,
}) => {
  const { t } = useTranslation('common');
  const [selectedAddress, setAddress] = useAtom(atom);
  const { openModal } = useModalAction();

  function onAdd() {
    openModal('ADD_OR_UPDATE_GUEST_ADDRESS', { type, atom });
  }

  function onEdit(address: any) {
    openModal('ADD_OR_UPDATE_GUEST_ADDRESS', { type, atom, address });
  }

  return (
    <div className={className}>
      <AddressHeader onAdd={onAdd} count={count} label={label} />
      {addresses && addresses?.length ? (
        <RadioGroup as="span" value={selectedAddress} onChange={setAddress}>
          <RadioGroup.Label className="sr-only">{label}</RadioGroup.Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {addresses?.map((address, idx) => {
              // Guest addresses live only in the atom and have NO id — key off
              // stable content instead of an always-undefined id.
              const key = `${address?.title ?? ''}-${address?.address?.zip ?? ''}-${idx}`;
              const shoppingCity = getStoredCity();
              const addressCity = addressCityOf(address);
              const cityMismatch =
                shoppingCity &&
                addressCity &&
                normalizeCityClient(addressCity) !== normalizeCityClient(shoppingCity);
              return (
                <RadioGroup.Option value={address} key={key}>
                  {({ checked }) => (
                    <div>
                      <AddressCard
                        checked={checked}
                        address={address}
                        onEdit={() => onEdit(address)}
                      />
                      {cityMismatch && (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-800">
                          This address is in {addressCity} but you&apos;re shopping
                          in {shoppingCity} — orders are delivered within{' '}
                          {shoppingCity}. Edit the address or switch city.{' '}
                          <button
                            type="button"
                            className="font-semibold underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEdit(address);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </RadioGroup.Option>
              );
            })}
          </div>
        </RadioGroup>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <span className="relative rounded border border-border-200 bg-gray-100 px-5 py-6 text-center text-base">
            {t('text-no-address')}
          </span>
        </div>
      )}
    </div>
  );
};
export default GuestAddressGrid;
