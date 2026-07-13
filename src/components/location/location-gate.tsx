'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useSetAtom } from 'jotai';
import { getStoredCity, setStoredCity, setStoredPincode } from '@/lib/customer-location';
import { getCityFromIP } from '@/lib/geocode';
import { usePincodeServiceability } from '@/lib/use-pincode-serviceability';
import { track } from '@/lib/analytics/track';
import {
  deliveryModeAtom,
  isNonServiceableAtom,
  detectedCityAtom,
  serviceableCityAtom,
} from '@/store/serviceability';
import CityPickerDialog from './city-picker-dialog';

const SESSION_FLAG = 'pah_loc_checked';

/**
 * App-wide location gate (mounted next to CitySync). Gently detects the
 * shopper's city by IP once per session (no permission prompt), checks
 * city+pincode serviceability, and — never blocking shopping — surfaces:
 *  - a "we don't deliver here directly" popup (Select City / Continue via
 *    courier) for a non-serviceable area, and
 *  - a "your location looks different" prompt for a returning shopper whose
 *    detected city no longer matches their saved one.
 * Precise GPS is offered on demand inside the city picker. Everything fails
 * open: any error simply leaves the shopper browsing the full store.
 */
export default function LocationGate() {
  const setDeliveryMode = useSetAtom(deliveryModeAtom);
  const setIsNonServiceable = useSetAtom(isNonServiceableAtom);
  const setDetectedCityAtom = useSetAtom(detectedCityAtom);
  const setServiceableCity = useSetAtom(serviceableCityAtom);

  const [detected, setDetected] = useState<{
    city: string;
    pincode?: string;
  } | null>(null);
  const [popup, setPopup] = useState<null | 'non_serviceable' | 'changed'>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ranRef = useRef(false);

  const { result, checked } = usePincodeServiceability(detected?.pincode ?? null);

  // Detect once per session (IP-based, gentle).
  useEffect(() => {
    if (ranRef.current || typeof window === 'undefined') return;
    ranRef.current = true;
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, '1');

    const stored = getStoredCity();
    getCityFromIP().then((addr) => {
      if (!addr?.city) {
        track('location_denied', { meta: { source: 'ip' } });
        return;
      }
      track('location_detected', { label: addr.city, meta: { source: 'ip' } });
      setDetected({ city: addr.city, pincode: addr.pincode?.replace(/\D/g, '') });
      setDetectedCityAtom(addr.city);
      if (!stored) {
        // First visit — provisionally adopt the detected city + pincode (drives live courier ETA).
        setStoredCity(addr.city);
        setStoredPincode(addr.pincode);
      } else if (stored.toLowerCase() !== addr.city.toLowerCase()) {
        setPopup('changed');
      }
    });
  }, [setDetectedCityAtom]);

  // React to the serviceability check on the detected pincode.
  useEffect(() => {
    if (!checked || !result || !detected) return;
    if (result.serviceable) {
      setDeliveryMode('standard');
      setIsNonServiceable(false);
      setServiceableCity(result.city ?? detected.city);
    } else if (popup !== 'changed') {
      setPopup('non_serviceable');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, result]);

  function continueViaCourier() {
    track('courier_mode_selected', { label: detected?.city });
    setDeliveryMode('courier');
    setIsNonServiceable(true);
    setPopup(null);
  }
  function openPicker() {
    setPopup(null);
    setPickerOpen(true);
  }
  function pickCity(name: string) {
    track('city_changed', { label: name });
    setStoredCity(name);
    setStoredPincode(null); // manual city switch — clear any stale detected pincode
    setDeliveryMode('standard');
    setIsNonServiceable(false);
    setServiceableCity(name);
    setPopup(null);
  }

  const isChanged = popup === 'changed';

  return (
    <>
      <Transition show={popup !== null} as={Fragment}>
        <Dialog onClose={() => setPopup(null)} className="relative z-[65]">
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
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-forest-900">
                  {isChanged
                    ? 'Your location looks different'
                    : 'We don’t deliver here directly'}
                </Dialog.Title>
                <p className="mt-2 text-sm text-stone-600">
                  {isChanged ? (
                    <>
                      We detected you might be in{' '}
                      <span className="font-semibold">{detected?.city}</span>.
                      Continue with this city?
                    </>
                  ) : (
                    <>
                      We currently don’t provide direct delivery in{' '}
                      <span className="font-semibold">{detected?.city}</span>. You
                      can pick a nearby serviceable city, or continue via courier —
                      courier deliveries may take longer, incur extra charges, and
                      have limited live-plant replacement coverage.
                    </>
                  )}
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {isChanged ? (
                    <>
                      <button
                        type="button"
                        onClick={openPicker}
                        className="rounded-lg border border-border-200 px-4 py-2.5 text-sm font-medium text-heading hover:bg-gray-50"
                      >
                        Choose another city
                      </button>
                      <button
                        type="button"
                        onClick={() => detected && pickCity(detected.city)}
                        className="rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                      >
                        Yes, use {detected?.city}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={continueViaCourier}
                        className="rounded-lg border border-border-200 px-4 py-2.5 text-sm font-medium text-heading hover:bg-gray-50"
                      >
                        Continue Anyway
                      </button>
                      <button
                        type="button"
                        onClick={openPicker}
                        className="rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                      >
                        Select City
                      </button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <CityPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={pickCity}
      />
    </>
  );
}
