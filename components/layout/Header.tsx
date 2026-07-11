'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Logo } from './Logo';
import { CitySelector } from './CitySelector';
import { useSession } from '@/lib/store/session';
import { useDrawer } from '@/lib/store/drawer';
import { useVerticals } from '@/lib/hooks/useVerticals';
import { authLogout } from '@/lib/api/auth';
import { getCart } from '@/lib/api/endpoints';
import { qk } from '@/lib/query-keys';

export function Header() {
  const user = useSession((s) => s.user);
  const setUser = useSession((s) => s.setUser);
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { verticals } = useVerticals();
  const openCart = useDrawer((s) => s.openCart);
  const bumpToken = useDrawer((s) => s.bumpToken);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openWorld, setOpenWorld] = useState<string | null>(null);

  const isHome = pathname === '/';
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cart badge (auth-only)
  const { data: cart } = useQuery({ queryKey: qk.cart, queryFn: getCart, enabled: !!user, staleTime: 10_000 });
  const cartCount = cart?.items?.length ?? 0;

  // Replay the WAAPI bump when an item is added
  const badgeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (bumpToken === 0 || !badgeRef.current) return;
    badgeRef.current.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
      { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' },
    );
  }, [bumpToken]);

  async function onLogout() {
    await authLogout();
    setUser(null);
    qc.clear();
    router.push('/');
  }

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q')?.toString().trim();
    setSearchOpen(false);
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  }

  const barText = transparent ? 'text-cream' : 'text-forest-ink';
  const iconBtn = `inline-flex flex-col items-center gap-0.5 text-[11px] font-medium ${barText} transition hover:opacity-80`;

  return (
    <>
      {/* Announcement strip */}
      <div className="bg-forest-ink text-cream">
        <div className="container-wide flex h-9 items-center justify-between text-[11px] font-medium tracking-wide">
          <div className="hidden sm:block">
            <CitySelector dark />
          </div>
          <p className="mx-auto sm:mx-0">
            <span className="text-cta">FREE shipping</span> over ₹499 · Extra 5% off prepaid
          </p>
          <Link href="/track-order" className="hidden text-cream/80 hover:text-cream sm:inline">
            Track order
          </Link>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 transition-colors duration-300 ${
          transparent ? 'bg-transparent' : 'border-b border-forest/10 bg-cream/90 backdrop-blur-xl'
        }`}
      >
        <div className="container-wide flex h-[68px] items-center justify-between gap-4">
          {/* Left: logo + desktop nav */}
          <div className="flex items-center gap-8">
            <button className={`xl:hidden ${barText}`} aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </button>
            <Link href="/" aria-label="PlantAtHome home">
              <Logo dark={transparent} />
            </Link>
          </div>

          {/* Center nav (xl+) */}
          <nav className="hidden items-center gap-1 xl:flex">
            {verticals.map((v) => (
              <div key={v.key} className="relative" onMouseEnter={() => setOpenWorld(v.key)} onMouseLeave={() => setOpenWorld(null)}>
                <Link
                  href={v.path}
                  className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition ${barText} hover:bg-black/5 ${
                    transparent ? 'hover:bg-white/10' : ''
                  }`}
                >
                  {v.label}
                  {v.isComingSoon && <span className="rounded-full bg-clay/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-clay">soon</span>}
                </Link>
                {openWorld === v.key && v.subcategories.length > 0 && (
                  <div className="absolute left-0 top-full z-50 min-w-[220px] rounded-2xl border border-forest/10 bg-white p-2 shadow-lift">
                    {v.subcategories.map((s) => (
                      <Link key={s.uuid} href={`/c/${s.slug}`} className="block rounded-xl px-3 py-2 text-sm text-forest-ink hover:bg-forest-soft">
                        {s.name}
                      </Link>
                    ))}
                    <Link href={v.path} className="mt-1 block rounded-xl px-3 py-2 text-sm font-semibold text-forest-accent hover:bg-forest-soft">
                      Shop all {v.label} →
                    </Link>
                  </div>
                )}
              </div>
            ))}
            <Link href="/offers" className={`rounded-full px-3.5 py-2 text-sm font-medium ${barText} hover:opacity-80`}>Offers</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4 sm:gap-5">
            <button onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" /><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </button>
            <div className="hidden sm:block"><CitySelector dark={transparent} /></div>
            <button onClick={openCart} className={`relative ${iconBtn}`} aria-label="Cart" data-testid="open-cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l-1 12a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 7Z" stroke="currentColor" strokeWidth="1.6" /><path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.6" /></svg>
              {cartCount > 0 && (
                <span ref={badgeRef} className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-cta-ink">
                  {cartCount}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/account" className={`hidden text-sm font-medium sm:inline ${transparent ? 'text-cream' : 'text-forest'}`}>
                  {user.name?.split(' ')[0] ?? 'Account'}
                </Link>
                <button onClick={onLogout} className="hidden rounded-full border border-current px-3.5 py-1.5 text-xs font-semibold sm:inline-flex" data-testid="logout" style={{ color: transparent ? '#F4F1EA' : '#2E5E2A' }}>
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-cta px-4 py-1.5 text-sm">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-forest-ink/70 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="container-wrap pt-28" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={submitSearch} className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-lift">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="ml-3 text-forest-accent"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" /><path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input name="q" autoFocus placeholder="Search plants, tools, planters…" className="w-full border-0 bg-transparent py-3 text-lg text-forest-ink focus:ring-0" />
              <button type="submit" className="btn-cta px-6 py-3">Search</button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-forest-ink text-cream">
          <div className="container-wide flex h-16 items-center justify-between">
            <Logo dark />
            <button aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
          <nav className="container-wide flex flex-1 flex-col gap-1 overflow-y-auto py-4">
            {verticals.map((v) => (
              <Link key={v.key} href={v.path} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-cream/10 py-3.5 font-pahserif text-2xl">
                {v.label}
                {v.isComingSoon && <span className="text-xs uppercase tracking-wide text-cta">soon</span>}
              </Link>
            ))}
            <Link href="/products" onClick={() => setMenuOpen(false)} className="py-3.5 text-lg text-cream/80">All products</Link>
            <Link href="/offers" onClick={() => setMenuOpen(false)} className="py-3.5 text-lg text-cream/80">Offers</Link>
            <Link href="/track-order" onClick={() => setMenuOpen(false)} className="py-3.5 text-lg text-cream/80">Track order</Link>
            <div className="mt-4"><CitySelector dark /></div>
          </nav>
        </div>
      )}
    </>
  );
}
