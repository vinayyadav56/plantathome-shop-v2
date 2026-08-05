'use client';
import React from 'react';
import { LineIcon } from '@/components/icons/line-icons';

type DeliveryOption = {
  type: 'instant' | 'courier';
  label: string;
  eta_days: number | null;
  eta_text: string;
  available: boolean;
  source: 'vendor' | 'live' | 'estimate';
  note?: string;
};

type DeliveryCheckResult = {
  pincode: string;
  city?: string | null;
  state?: string | null;
  serviceable: boolean;
  reason?: string;
  message?: string;
  options: DeliveryOption[];
};

const API = process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? '';

/**
 * "Check delivery" — the customer types a pincode and gets EVERY way we can get
 * this plant to them, each with its own time: a local nursery run and a courier
 * parcel are different promises, so both are shown rather than collapsed into
 * one number.
 *
 * The courier ETA is a live partner quote server-side; when the partner can't be
 * reached the row still renders with a range, because "we can courier this, the
 * exact date is pending" is true and useful, while an error is neither.
 */
export function DeliveryCheck({ productId }: { productId?: number }) {
  const [pincode, setPincode] = React.useState('');
  const [state, setState] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = React.useState<DeliveryCheckResult | null>(null);

  const valid = /^\d{6}$/.test(pincode);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || state === 'loading') return;
    setState('loading');
    try {
      const qs = new URLSearchParams({ pincode });
      if (productId) qs.set('product_id', String(productId));
      const res = await fetch(`${API}/delivery-options?${qs}`, {
        headers: { Accept: 'application/json' },
      });
      const data = (await res.json()) as DeliveryCheckResult;
      setResult(data);
      setState('done');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="mt-4 border-t border-[#ECECEC] pt-4">
      <label
        htmlFor="delivery-pincode"
        className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#184A31]"
      >
        Check delivery
      </label>

      <form onSubmit={check} className="mt-2 flex gap-2">
        <input
          id="delivery-pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
            setState('idle');
          }}
          placeholder="Enter pincode"
          aria-describedby="delivery-check-result"
          className="h-11 w-full rounded-[10px] border border-[#DCDCDC] px-3 text-[14px] text-[#184A31] outline-none placeholder:text-[#9A9A9A] focus:border-[#24693E]"
        />
        <button
          type="submit"
          disabled={!valid || state === 'loading'}
          className="h-11 shrink-0 rounded-[10px] bg-[#2E5E2A] px-5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {state === 'loading' ? 'Checking…' : 'Check'}
        </button>
      </form>

      <div id="delivery-check-result" aria-live="polite">
        {state === 'error' && (
          <p className="mt-3 text-[13px] text-[#B4413C]">
            Couldn&apos;t check right now. Please try again.
          </p>
        )}

        {state === 'done' && result && !result.serviceable && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[13px] text-stone-600">
            <LineIcon name="alert" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
            <span>{result.message || `We don't deliver to ${result.pincode} yet.`}</span>
          </div>
        )}

        {state === 'done' && result?.serviceable && (
          <div className="mt-3 space-y-2">
            {result.city && (
              <p className="text-[12px] text-[#6B6B6B]">
                Delivering to <span className="font-medium text-[#184A31]">{result.city}</span>
              </p>
            )}
            {result.options.map((o) => (
              <div
                key={o.type}
                className="flex items-start gap-2.5 rounded-[10px] border border-[#ECECEC] bg-[#FAFAF7] px-3 py-2.5"
              >
                <LineIcon
                  name={o.type === 'instant' ? 'leaf' : 'truck'}
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#24693E]"
                />
                <span className="min-w-0 flex-1 text-[13px] text-[#184A31]">
                  <span className="font-semibold">{o.label}</span>
                  {o.note && <span className="block text-[12px] text-[#6B6B6B]">{o.note}</span>}
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-[#24693E]">
                  {o.eta_text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryCheck;
