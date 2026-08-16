import { useModalAction } from '@/components/ui/modal/modal.context';
import { RadioGroup } from '@headlessui/react';
import { useAtom, WritableAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import AddressCard from '@/components/address/address-card';
import { AddressHeader } from '@/components/address/address-header';
import { useTranslation } from 'next-i18next';
import type { Address } from '@/types';
import { useCustomerCity } from '@/lib/use-customer-city';
import { addressCityOf, normalizeCityClient } from '@/lib/shopping-city';
import { isAddressComplete } from '@/lib/address-complete';
import CityMismatchDialog from './city-mismatch-dialog';

interface AddressesProps {
  addresses: Address[] | undefined | null;
  label: string;
  atom: WritableAtom<Address | null, any, Address>;
  className?: string;
  userId: string;
  count: number;
  type: string;
}

/**
 * Saved-address picker, Shopping-City aware: addresses in the current shopping
 * city come first; other-city addresses sit in a visually separated "Other
 * cities" group and picking one opens the mismatch dialog ([Choose Another
 * Address] / [Change Shopping City]) instead of selecting it. Auto-select only
 * ever picks a MATCHING address. Addresses whose city is unknown are treated
 * as matching (the server checkout gate is the final authority).
 */
export const AddressGrid: React.FC<AddressesProps> = ({
  addresses,
  label,
  atom,
  className,
  userId,
  count,
  type,
}) => {
  const { t } = useTranslation('common');
  const [selectedAddress, setAddress] = useAtom(atom);
  const { openModal } = useModalAction();
  const { city: shoppingCity } = useCustomerCity();
  const [mismatch, setMismatch] = useState<Address | null>(null);

  const cityKey = normalizeCityClient(shoppingCity);
  const { matching, others } = useMemo(() => {
    const matching: Address[] = [];
    const others: Address[] = [];
    for (const a of addresses ?? []) {
      const ac = addressCityOf(a);
      if (!shoppingCity || !ac || normalizeCityClient(ac) === cityKey) {
        matching.push(a);
      } else {
        others.push(a);
      }
    }
    return { matching, others };
  }, [addresses, shoppingCity, cityKey]);

  // Complete-on-use: the address sent to the edit modal because it was missing
  // details — select it once it comes back complete from the save.
  const pendingCompletionIdRef = useRef<Address['id'] | null>(null);

  useEffect(() => {
    if (matching.length) {
      // An address just completed via the modal wins the selection.
      if (pendingCompletionIdRef.current) {
        const completed = matching.find(
          (a) => a.id === pendingCompletionIdRef.current,
        );
        if (completed && isAddressComplete(completed)) {
          pendingCompletionIdRef.current = null;
          setAddress(completed);
          return;
        }
      }
      if (selectedAddress?.id) {
        const found = matching.find((a) => a.id === selectedAddress.id);
        if (found && isAddressComplete(found)) {
          setAddress(found);
          return;
        }
      }
      // Auto-select only COMPLETE addresses, preferring the server default.
      const complete = matching.filter((a) => isAddressComplete(a));
      const preferred = complete.find((a) => a?.default) ?? complete[0];
      if (preferred) {
        setAddress(preferred);
      } else if (selectedAddress?.id) {
        setAddress(null as any);
      }
    } else if (selectedAddress?.id) {
      // The previously selected address no longer matches the shopping city.
      const stillListed = (addresses ?? []).some((a) => a.id === selectedAddress.id);
      if (!stillListed) setAddress(null as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matching, matching.length, selectedAddress?.id, setAddress]);

  function onAdd() {
    openModal('ADD_OR_UPDATE_ADDRESS', { customerId: userId, type });
  }
  function onEdit(address: any) {
    openModal('ADD_OR_UPDATE_ADDRESS', { customerId: userId, address });
  }
  function onDelete(address: any) {
    openModal('DELETE_ADDRESS', { customerId: userId, addressId: address?.id });
  }

  function pick(address: Address) {
    const ac = addressCityOf(address);
    if (shoppingCity && ac && normalizeCityClient(ac) !== cityKey) {
      setMismatch(address);
      return;
    }
    // Complete-on-use: don't select an address with missing required fields —
    // open the edit modal prefilled so the shopper fills the gaps first.
    if (!isAddressComplete(address)) {
      pendingCompletionIdRef.current = address.id;
      openModal('ADD_OR_UPDATE_ADDRESS', { customerId: userId, address });
      return;
    }
    setAddress(address);
  }

  return (
    <div className={className}>
      <AddressHeader onAdd={onAdd} count={count} label={label} />
      {!addresses?.length ? (
        <div className="grid grid-cols-1 gap-4">
          <span className="relative rounded border border-border-200 bg-gray-100 px-5 py-6 text-center text-base">
            {t('text-no-address')}
          </span>
        </div>
      ) : (
        <>
          {matching.length ? (
            <RadioGroup value={selectedAddress} onChange={pick}>
              <RadioGroup.Label className="sr-only">{label}</RadioGroup.Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {/* h-full on the Option: it is the grid item, so the card can only stretch to
                    the row height if its wrapper does too. */}
                {matching.map((address) => (
                  <RadioGroup.Option value={address} key={address?.id} className="h-full">
                    {({ checked }: { checked: boolean }) => (
                      <AddressCard
                        checked={checked}
                        onDelete={() => onDelete(address)}
                        onEdit={() => onEdit(address)}
                        address={address}
                        defaultBadge={Boolean(address?.default)}
                        needsDetails={!isAddressComplete(address)}
                      />
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <span className="relative rounded border border-border-200 bg-gray-100 px-5 py-6 text-center text-sm text-stone-600">
                No saved address in{' '}
                <span className="font-semibold">{shoppingCity}</span> yet — add
                one, or change your shopping city.
              </span>
            </div>
          )}

          {others.length ? (
            <div className="mt-5 border-t border-dashed border-border-200 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
                Other cities (not deliverable while shopping in {shoppingCity})
              </p>
              <div className="grid grid-cols-1 gap-4 opacity-70 sm:grid-cols-2 md:grid-cols-3">
                {others.map((address) => (
                  <button
                    type="button"
                    key={address?.id}
                    onClick={() => pick(address)}
                    className="h-full text-left"
                  >
                    <AddressCard
                      checked={false}
                      onDelete={() => onDelete(address)}
                      onEdit={() => onEdit(address)}
                      address={address}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      <CityMismatchDialog
        open={mismatch !== null}
        shoppingCity={shoppingCity ?? ''}
        addressCity={addressCityOf(mismatch) ?? ''}
        onClose={() => setMismatch(null)}
        onChooseAnother={() => setMismatch(null)}
      />
    </div>
  );
};
export default AddressGrid;
