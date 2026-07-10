'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authLogin } from '@/lib/api/auth';
import { addCartItem } from '@/lib/api/endpoints';
import { useSession } from '@/lib/store/session';
import { qk } from '@/lib/query-keys';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const setUser = useSession((s) => s.setUser);
  const pendingCart = useSession((s) => s.pendingCart);
  const setPendingCart = useSession((s) => s.setPendingCart);

  const [email, setEmail] = useState('customer@plantathome.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = params.get('next') || '/';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await authLogin(email, password);
      setUser(user);

      // Replay a stashed add-to-cart intent, if any, then land on the cart.
      if (pendingCart) {
        const { slug: _slug, ...intent } = pendingCart;
        await addCartItem(intent).catch(() => {});
        setPendingCart(null);
        await qc.invalidateQueries({ queryKey: qk.cart });
        router.replace('/cart');
        return;
      }
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-wrap flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-heading text-3xl font-semibold text-forest-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-forest-ink/60">Sign in to check out and track your orders.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-forest-ink">Email</label>
            <input
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-forest-ink">Password</label>
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-cta w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 rounded-lg bg-forest-soft/60 px-3 py-2 text-xs text-forest-ink/70">
          Demo: <b>customer@plantathome.test</b> / <b>Passw0rd!</b>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-wrap py-16 text-center text-forest-ink/50">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
