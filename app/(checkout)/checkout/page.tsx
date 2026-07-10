'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCart, startCheckout, payCheckout } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { formatMoney } from '@/lib/money';
import { useSession } from '@/lib/store/session';
import type { CheckoutSession } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';

/** One idempotency key per checkout session, reused on every pay retry so a
 *  lost-response-but-server-succeeded case returns the same order. */
function idemKeyFor(checkoutUuid: string): string {
  const k = `idem:${checkoutUuid}`;
  let v = sessionStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    sessionStorage.setItem(k, v);
  }
  return v;
}

export default function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const cityName = useSession((s) => s.cityName);

  const { data: cart } = useQuery({ queryKey: qk.cart, queryFn: getCart });

  const [line1, setLine1] = useState('');
  const [city, setCity] = useState(cityName ?? '');
  const [coupon, setCoupon] = useState('');
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      startCheckout({ address: { line1, city }, coupon: coupon.trim() || undefined }),
    onSuccess: (s) => {
      setSession(s);
      setError(null);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'EMPTY_CART') {
        router.replace('/cart');
        return;
      }
      setError(e instanceof Error ? e.message : 'Could not start checkout.');
    },
  });

  const pay = useMutation({
    mutationFn: () => payCheckout(session!.checkout_uuid, idemKeyFor(session!.checkout_uuid)),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: qk.cart });
      router.replace(`/orders/${res.order.uuid}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Payment failed.'),
  });

  const totals = session?.totals;

  return (
    <div className="container-wrap max-w-2xl py-10">
      <h1 className="mb-8 font-heading text-4xl font-semibold text-forest-ink">Checkout</h1>

      {/* Step 1: address + coupon */}
      <section className={`card p-6 ${session ? 'opacity-60' : ''}`}>
        <h2 className="mb-4 font-heading text-xl font-semibold text-forest-ink">1 · Delivery details</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-forest-ink">Address</label>
            <input
              className="field"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="Flat / house, street, area"
              disabled={!!session}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-ink">City</label>
              <input className="field" value={city} onChange={(e) => setCity(e.target.value)} disabled={!!session} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-forest-ink">Coupon (optional)</label>
              <input
                className="field"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE10"
                disabled={!!session}
              />
            </div>
          </div>
        </div>

        {!session && (
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !line1.trim() || !city.trim()}
            className="btn-cta mt-5"
            data-testid="continue-to-pay"
          >
            {create.isPending ? 'Preparing…' : 'Continue to payment'}
          </button>
        )}
      </section>

      {/* Step 2: review + pay */}
      {session && totals && (
        <section className="card mt-6 p-6">
          <h2 className="mb-4 font-heading text-xl font-semibold text-forest-ink">2 · Review &amp; pay</h2>
          <dl className="space-y-2 text-forest-ink/80">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal)}</dd>
            </div>
            {totals.discount && totals.discount.amount_minor > 0 && (
              <div className="flex justify-between text-forest-accent">
                <dt>Discount{session.coupon ? ` (${session.coupon})` : ''}</dt>
                <dd>−{formatMoney(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-forest/10 pt-2 text-lg font-semibold text-forest-ink">
              <dt>Total</dt>
              <dd data-testid="checkout-total">{formatMoney(totals.grand_total)}</dd>
            </div>
          </dl>

          <button onClick={() => pay.mutate()} disabled={pay.isPending} className="btn-cta mt-5 w-full" data-testid="pay-now">
            {pay.isPending ? 'Processing…' : `Pay ${formatMoney(totals.grand_total)}`}
          </button>
          <p className="mt-2 text-center text-xs text-forest-ink/45">Simulated payment (staging).</p>
        </section>
      )}

      {error && <p className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {cart && cart.items.length === 0 && !session && (
        <p className="mt-4 text-sm text-forest-ink/60">Your cart is empty.</p>
      )}
    </div>
  );
}
