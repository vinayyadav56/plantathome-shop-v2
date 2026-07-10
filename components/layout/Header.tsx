'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Logo } from './Logo';
import { CitySelector } from './CitySelector';
import { useSession } from '@/lib/store/session';
import { authLogout } from '@/lib/api/auth';

export function Header() {
  const user = useSession((s) => s.user);
  const setUser = useSession((s) => s.setUser);
  const router = useRouter();
  const qc = useQueryClient();

  async function onLogout() {
    await authLogout();
    setUser(null);
    qc.clear();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/85 backdrop-blur">
      <div className="container-wrap flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="PlantAtHome home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-forest-ink/80 md:flex">
            <Link href="/products" className="hover:text-forest">
              Shop plants
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <CitySelector />
          <Link href="/cart" className="text-sm font-medium text-forest-ink/80 hover:text-forest" aria-label="Cart">
            Cart
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/account" className="hidden text-sm font-medium text-forest sm:inline">
                {user.name?.split(' ')[0] ?? 'Account'}
              </Link>
              <button onClick={onLogout} className="btn-outline px-4 py-1.5 text-sm" data-testid="logout">
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-cta px-4 py-1.5 text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
