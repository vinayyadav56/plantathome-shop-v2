'use client';
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAtom } from 'jotai';
import { useCart } from '@/store/quick-cart/cart.context';
import { authorizationAtom } from '@/store/authorization-atom';
import { itemsToCartLines } from '@/framework/server-cart';
import { setStoredCity, setStoredPincode } from '@/lib/customer-location';
import { validateCartCity, saveShoppingCityToProfile } from '@/lib/shopping-city';
import { track } from '@/lib/analytics/track';

interface Props {
  open: boolean;
  targetCity: string | null;
  onClose: () => void;
  /** Called after the switch fully applies (city stored, cart migrated). */
  onSwitched?: (city: string) => void;
}

/**
 * Change-Shopping-City confirmation. With items in the cart it re-validates
 * every line against the target city (POST cart/validate-city): available
 * lines are KEPT (server-repriced on the next verify), unavailable lines are
 * dropped and listed so the shopper knows exactly what changed. An empty cart
 * switches instantly. The city itself is only stored AFTER confirmation —
 * cancelling leaves everything untouched.
 */
export default function ChangeCityDialog({ open, targetCity, onClose, onSwitched }: Props) {
  const { items, clearItemFromCart } = useCart();
  const [isAuthorized] = useAtom(authorizationAtom);
  const [busy, setBusy] = useState(false);
  const [dropped, setDropped] = useState<any[] | null>(null);

  const count = items?.length ?? 0;

  function applyCity(city: string) {
    track('city_changed', { label: city });
    setStoredCity(city);
    setStoredPincode(null); // manual switch — stale pincode must not linger
    if (isAuthorized) saveShoppingCityToProfile(city);
    onSwitched?.(city);
  }

  async function confirm() {
    if (!targetCity) return;
    if (!count) {
      applyCity(targetCity);
      onClose();
      return;
    }
    setBusy(true);
    try {
      const lines = itemsToCartLines(items as any[]);
      const result = await validateCartCity(targetCity, lines);
      if (result && result.unavailable.length) {
        // Drop what the target city can't serve; map server lines → cart item ids.
        const droppedItems: any[] = [];
        for (const u of result.unavailable) {
          const match = (items as any[]).find(
            (it) =>
              Number(it.productId ?? it.id) === u.product_id &&
              (u.variation_option_id == null ||
                Number(it.variationId ?? 0) === u.variation_option_id),
          );
          if (match) {
            droppedItems.push(match);
            clearItemFromCart(match.id);
          }
        }
        applyCity(targetCity);
        setDropped(droppedItems);
        return; // keep dialog open to show what was removed
      }
      // Everything available (or validation unreachable → fail-open, keep all).
      applyCity(targetCity);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function done() {
    setDropped(null);
    onClose();
  }

  return (
    <Transition show={open} as={Fragment}>
      {/* z-95: also launched from a dialog, and it can sit on top of the picker above. It tied
          with the city-mismatch prompt at z-75 and won only by DOM order, which is not a rule. */}
      <Dialog onClose={busy ? () => {} : done} className="relative z-[95]">
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
              {dropped === null ? (
                <>
                  <Dialog.Title className="text-lg font-semibold text-forest-900">
                    Switch shopping city to {targetCity}?
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-stone-600">
                    Products, prices and availability will refresh for{' '}
                    <span className="font-semibold">{targetCity}</span>.
                    {count ? (
                      <>
                        {' '}
                        Your cart has{' '}
                        <span className="font-semibold">
                          {count} item{count > 1 ? 's' : ''}
                        </span>{' '}
                        — we&rsquo;ll keep everything that&rsquo;s available in{' '}
                        {targetCity} and remove the rest.
                      </>
                    ) : null}
                  </p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={done}
                      disabled={busy}
                      className="rounded-lg border border-border-200 px-4 py-2.5 text-sm font-medium text-heading hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirm}
                      disabled={busy || !targetCity}
                      className="rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      {busy ? 'Checking cart…' : `Switch to ${targetCity}`}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Dialog.Title className="text-lg font-semibold text-forest-900">
                    Some items aren&rsquo;t available in {targetCity}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-stone-600">
                    We removed {dropped.length} item{dropped.length > 1 ? 's' : ''}{' '}
                    that {dropped.length > 1 ? "aren't" : "isn't"} available in
                    your new city. Everything else stays in your cart.
                  </p>
                  <ul className="mt-3 max-h-44 space-y-1.5 overflow-auto rounded-lg border border-gray-100 p-3">
                    {dropped.map((it: any) => (
                      <li key={it.id} className="flex items-center gap-2 text-sm text-stone-700">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                        <span className="line-clamp-1">{it.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={done}
                      className="rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Got it
                    </button>
                  </div>
                </>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
