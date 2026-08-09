import { useState } from 'react';
import { useMutation } from 'react-query';
import { HttpClient } from '@/framework/client/http-client';
import { Check } from '@/components/ui/icon';

/**
 * Inline "Notify me" capture for non-serviceable pincodes. Posts to the
 * delivery waitlist; dedupes locally so the same pincode isn't re-submitted
 * from this browser.
 */
export default function DeliveryNotifyMe({ pincode }: { pincode: string }) {
  const clean = (pincode ?? '').replace(/\D/g, '');
  const storageKey = `pah_notify_${clean}`;
  const [email, setEmail] = useState('');
  const [done, setDone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem(storageKey));
  });

  const { mutate, isLoading } = useMutation(
    () => HttpClient.post('delivery-notify', { pincode: clean, email }),
    {
      onSuccess: () => {
        try {
          window.localStorage.setItem(storageKey, '1');
        } catch {}
        setDone(true);
      },
      // Even on failure, don't trap the user in a form loop — the waitlist is
      // best-effort.
      onError: () => setDone(true),
    },
  );

  if (!clean || clean.length < 6) return null;

  if (done) {
    return (
      <p className="mt-2 flex items-center gap-1 text-[12.5px] text-forest-700">
        <Check size={14} className="shrink-0" aria-hidden />
        We&apos;ll let you know when delivery opens up in {clean}.
      </p>
    );
  }

  return (
    <form
      className="mt-2 flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.includes('@')) mutate();
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email me when you deliver here"
        className="w-full max-w-[260px] rounded-md border border-kraft-300 bg-white px-3 py-1.5 text-[12.5px] outline-none focus:border-forest-500"
      />
      <button
        type="submit"
        disabled={isLoading || !email.includes('@')}
        className="shrink-0 rounded-md bg-forest-700 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-forest-800 disabled:opacity-50"
      >
        Notify me
      </button>
    </form>
  );
}
