'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCart, removeCartItem } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';
import { formatMoney } from '@/lib/money';

export default function CartPage() {
  const qc = useQueryClient();
  const { data: cart, isLoading } = useQuery({ queryKey: qk.cart, queryFn: getCart });

  const remove = useMutation({
    mutationFn: (itemUuid: string) => removeCartItem(itemUuid),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart }),
  });

  if (isLoading) {
    return <div className="container-wrap py-16 text-forest-ink/50">Loading your cart…</div>;
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="container-wrap py-20 text-center">
        <h1 className="font-heading text-3xl font-semibold text-forest-ink">Your cart is empty</h1>
        <p className="mt-2 text-forest-ink/60">Find a plant you love and add it here.</p>
        <Link href="/products" className="btn-cta mt-6 inline-flex">
          Shop plants
        </Link>
      </div>
    );
  }

  // Group by nursery for a per-vendor preview (mirrors how the order splits).
  const byNursery = items.reduce<Record<string, typeof items>>((acc, it) => {
    (acc[it.nursery_id] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="container-wrap grid gap-10 py-10 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <h1 className="font-heading text-4xl font-semibold text-forest-ink">Your cart</h1>
        {Object.entries(byNursery).map(([nursery, group], gi) => (
          <div key={nursery} className="card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-forest-accent">
              Nursery {gi + 1}
            </p>
            <ul className="divide-y divide-forest/10">
              {group.map((it) => (
                <li key={it.uuid} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-forest-ink">Plant</p>
                    <p className="text-sm text-forest-ink/55">
                      Qty {it.qty}
                      {it.options && it.options.length > 0 ? ` · ${it.options.length} add-on(s)` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-forest-ink">{formatMoney(it.price)}</span>
                    <button
                      onClick={() => remove.mutate(it.uuid)}
                      className="text-sm text-clay hover:underline"
                      disabled={remove.isPending}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Summary */}
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="card space-y-4 p-6">
          <h2 className="font-heading text-2xl font-semibold text-forest-ink">Summary</h2>
          <div className="flex justify-between text-forest-ink/80">
            <span>Subtotal</span>
            <span className="font-semibold">
              {formatMoney({ amount_minor: cart?.grand_total_minor ?? 0, currency: 'INR' })}
            </span>
          </div>
          <p className="text-xs text-forest-ink/50">Taxes &amp; delivery calculated at checkout.</p>
          <Link href="/checkout" className="btn-cta w-full" data-testid="to-checkout">
            Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
