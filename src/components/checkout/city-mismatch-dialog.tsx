'use client';
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import CityPickerDialog from '@/components/location/city-picker-dialog';
import ChangeCityDialog from '@/components/location/change-city-dialog';

interface Props {
  open: boolean;
  shoppingCity: string;
  addressCity: string;
  onClose: () => void;
  /** "Choose Another Address" — caller scrolls/focuses the address grid. */
  onChooseAnother: () => void;
}

/**
 * The Shopping-City ≠ delivery-address-city hard-block dialog (spec message
 * verbatim). Two ways out: pick a matching address, or change the shopping
 * city (full picker → confirm → cart re-validation via ChangeCityDialog).
 */
export default function CityMismatchDialog({
  open,
  shoppingCity,
  addressCity,
  onClose,
  onChooseAnother,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingCity, setPendingCity] = useState<string | null>(null);

  return (
    <>
      <Transition show={open} as={Fragment}>
        <Dialog onClose={onClose} className="relative z-[75]">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-box">
                <Dialog.Title className="text-lg font-semibold text-forest-900">
                  Address city doesn&rsquo;t match your shopping city
                </Dialog.Title>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  The selected delivery address belongs to{' '}
                  <span className="font-semibold">{addressCity}</span>, but you
                  are currently shopping in{' '}
                  <span className="font-semibold">{shoppingCity}</span>. Please
                  select a {shoppingCity} address or change your shopping city.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onChooseAnother();
                    }}
                    className="rounded-lg border border-border-200 px-4 py-2.5 text-sm font-medium text-heading hover:bg-gray-50"
                  >
                    Choose Another Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="rounded-control bg-ds-btn hover:bg-ds-btn-hover px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                  >
                    Change Shopping City
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <CityPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(name) => {
          setPickerOpen(false);
          setPendingCity(name);
        }}
      />
      <ChangeCityDialog
        open={pendingCity !== null}
        targetCity={pendingCity}
        onClose={() => setPendingCity(null)}
        onSwitched={() => {
          setPendingCity(null);
          onClose();
        }}
      />
    </>
  );
}
