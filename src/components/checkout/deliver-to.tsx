'use client';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { RadioGroup } from '@headlessui/react';
import {
  deliverToAtom,
  recipientNameAtom,
  recipientPhoneAtom,
  saveRecipientAddressAtom,
} from '@/store/deliver-to';

/** Indian mobile: exactly 10 digits starting 6-9. */
export const RECIPIENT_PHONE_RE = /^[6-9]\d{9}$/;

/**
 * Checkout Delivery-Type step: "Deliver to Me" (default, existing address flow)
 * vs "Deliver to Someone Else" (recipient name + phone captured here; the
 * address itself is still picked/created through the same grid + map-pin
 * form, so recipient addresses get identical city validation).
 */
export default function DeliverTo({ count, label }: { count?: number; label?: string }) {
  const [deliverTo, setDeliverTo] = useAtom(deliverToAtom);
  const [name, setName] = useAtom(recipientNameAtom);
  const [phone, setPhone] = useAtom(recipientPhoneAtom);
  const [save, setSave] = useAtom(saveRecipientAddressAtom);
  const [touched, setTouched] = useState({ name: false, phone: false });

  const nameError =
    touched.name && !name.trim() ? 'Recipient name is required.' : null;
  const phoneError =
    (touched.phone || phone.length === 10) && !RECIPIENT_PHONE_RE.test(phone)
      ? 'Enter a valid 10-digit mobile number starting with 6-9.'
      : null;

  return (
    <div className="pa-checkout-step">
      <div className="mb-4 flex items-center gap-3">
        {count ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-800 text-sm font-semibold text-white">
            {count}
          </span>
        ) : null}
        <p className="text-lg font-semibold capitalize text-heading">
          {label ?? 'Delivery type'}
        </p>
      </div>

      <RadioGroup value={deliverTo} onChange={setDeliverTo}>
        {/* Two per row on mobile too. These are a binary choice, so stacking them pushed the
            rest of the step below the fold for no benefit; the text shrinks instead. */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { value: 'me', title: 'Deliver to Me', sub: 'Use one of my addresses' },
            {
              value: 'someone_else',
              title: 'Deliver to Someone Else',
              sub: 'Send as a gift — add their details',
            },
          ].map((opt) => (
            <RadioGroup.Option key={opt.value} value={opt.value}>
              {({ checked }) => (
                <div
                  className={`h-full cursor-pointer rounded-xl border p-3 transition-colors sm:p-4 ${
                    checked
                      ? 'border-forest-800 bg-forest-800/5 ring-1 ring-forest-800'
                      : 'border-border-200 hover:border-forest-800/40'
                  }`}
                >
                  <p className="text-[13px] font-semibold leading-snug text-heading sm:text-sm">
                    {opt.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-stone-500 sm:text-xs">
                    {opt.sub}
                  </p>
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>

      {deliverTo === 'someone_else' ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-heading">
              Recipient name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, name: true }))}
              placeholder="Who receives this order?"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none ${
                nameError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border-base focus:border-accent'
              }`}
            />
            {nameError ? (
              <p className="mt-1 text-xs text-red-500">{nameError}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-heading">
              Recipient phone <span className="text-red-500">*</span>
            </label>
            <input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              onBlur={() => setTouched((s) => ({ ...s, phone: true }))}
              placeholder="10-digit mobile number"
              inputMode="tel"
              maxLength={10}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none ${
                phoneError
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-border-base focus:border-accent'
              }`}
            />
            {phoneError ? (
              <p className="mt-1 text-xs text-red-500">{phoneError}</p>
            ) : null}
          </div>
          <label className="col-span-full flex cursor-pointer items-center gap-2.5 text-sm text-heading">
            <input
              type="checkbox"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
              className="h-4 w-4 rounded border-border-base text-accent focus:ring-accent"
            />
            Save this address to my address book
          </label>
          <p className="col-span-full text-xs text-stone-500">
            Pick or add the recipient&rsquo;s address below — it must be in your
            current shopping city.
          </p>
        </div>
      ) : null}
    </div>
  );
}
