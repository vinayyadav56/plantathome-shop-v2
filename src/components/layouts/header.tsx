import React from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from '@/compat/next-router';
import { useTranslation } from 'next-i18next';
import { BrandLogo } from '@/components/storefront/logo-mark';
import { Icon } from '@/components/storefront/icons';
import { EXPO } from '@/components/storefront/motion';
import { SearchIcon } from '@/components/icons/search-icon';
import { useCart } from '@/store/quick-cart/cart.context';
import { drawerAtom } from '@/store/drawer-atom';
import { authorizationAtom } from '@/store/authorization-atom';
import { displayMobileHeaderSearchAtom } from '@/store/display-mobile-header-search-atom';
import { useModalAction } from '@/components/ui/modal/modal.context';
import CitySwitcher from '@/components/location/city-switcher';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import { getVerticalMeta } from '@/components/storefront/verticals';
import Search from '@/components/ui/search/search';
import { ChevronDown, CircleHelp, Heart, Truck } from '@/components/ui/icon';



type NavItem = { label: string; href: string; menu?: { label: string; href: string }[] };

// Vertical nav entries are built at render time from the API types (city-aware,
// works on any catalogue — staging's 6 verticals AND production's 3, whose slugs
// differ, e.g. farm-box). Only the dropdown CONTENTS are curated here, keyed by
// type slug with REAL category slugs (verified against the live catalogue — the
// old hardcoded list had guessed slugs that 404'd). A type without an entry
// simply renders as a plain link.
const CATEGORY_MENUS: Record<string, { label: string; href: string }[]> = {
  plants: [
    { label: 'Indoor Plants', href: '/c/indoor' },
    { label: 'Outdoor Plants', href: '/c/outdoor' },
    { label: 'Flowering Plants', href: '/c/flowering' },
    { label: 'Air-purifying', href: '/c/air-purifying' },
    { label: 'Succulents & Cacti', href: '/c/succulents-cacti' },
    { label: 'Pet-friendly', href: '/c/pet-friendly' },
    { label: 'Herbs', href: '/c/herbs' },
    { label: 'Climbers & Vines', href: '/c/climbers-vines' },
    { label: 'All Categories', href: '/categories' },
  ],
  tools: [
    { label: 'Pruning & Cutting', href: '/c/pruning-cutting' },
    { label: 'Watering', href: '/c/watering-tools' },
    { label: 'Soil & Care', href: '/c/soil-care' },
    { label: 'Tool Sets', href: '/c/tool-sets' },
    { label: 'Accessories', href: '/c/tool-accessories' },
    { label: 'All Categories', href: '/categories' },
  ],
  farmbox: [
    { label: 'Seasonal Veg Box', href: '/c/veg-box' },
    { label: 'Fresh Fruits', href: '/c/fresh-fruits' },
    { label: 'Salad & Greens', href: '/c/salad-greens' },
    { label: 'Herbs', href: '/c/fresh-herbs' },
    { label: 'Exotic Picks', href: '/c/exotic-picks' },
    { label: 'Juices & Cold-press', href: '/c/juices-cold-press' },
  ],
  // Production's FarmBox type slug + its live root categories.
  'farm-box': [
    { label: 'Tropical Fruits', href: '/c/tropical-fruits' },
    { label: 'Citrus', href: '/c/citrus' },
    { label: 'Berries', href: '/c/berries' },
    { label: 'Stone Fruits', href: '/c/stone-fruits' },
    { label: 'All Categories', href: '/categories' },
  ],
};

const NAV_TAIL: NavItem[] = [
  { label: 'Plant Care', href: '/plant-doctor' },
  { label: 'Offers', href: '/offers' },
];

/**
 * PlantAtHome brand header — solid dark announcement strip (static, scrolls
 * away) over a sticky white frosted navbar with centred nav, inline search,
 * profile + cart. Wired to the real cart drawer, login + search.
 */
const Header = ({ layout }: { layout?: string }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { totalUniqueItems } = useCart();
  const [, setDrawer] = useAtom(drawerAtom);
  const [isAuthorize] = useAtom(authorizationAtom);
  const { openModal } = useModalAction();

  const [searchOpen, setSearchOpen] = useAtom(displayMobileHeaderSearchAtom);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const openCart = () => setDrawer({ display: true, view: 'cart' });

  // Premium add-to-cart feedback: the fly-to-cart animation (lib/cart-animation)
  // dispatches `pah-cart-bump` when the product image lands (pulse the badge) and
  // `pah-open-cart` to reveal the mini-cart. Decoupled via window events so any
  // add-to-cart button anywhere triggers it without prop-drilling.
  const cartBtnRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    const onBump = () =>
      cartBtnRef.current?.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.35)' },
          { transform: 'scale(1)' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
      );
    const onOpen = () => setDrawer({ display: true, view: 'cart' });
    window.addEventListener('pah-cart-bump', onBump);
    window.addEventListener('pah-open-cart', onOpen);
    return () => {
      window.removeEventListener('pah-cart-bump', onBump);
      window.removeEventListener('pah-open-cart', onOpen);
    };
  }, [setDrawer]);

  const onProfile = () => {
    if (isAuthorize) router.push('/profile');
    else goToSignin();
  };

  // Vertical nav items from the live catalogue (SSR-prefetched with the same
  // query key, so no flash). Ops city kill-switches hide a vertical here too.
  const { types } = useTypes({ limit: TYPES_PER_PAGE } as any);
  const NAV: NavItem[] = React.useMemo(() => {
    const verticals: NavItem[] = (types ?? []).map((ty: any) => {
      const meta = getVerticalMeta(ty.slug, ty.name);
      return {
        label: ty.name ?? meta.label,
        href: meta.shopPath ?? meta.path,
        menu: CATEGORY_MENUS[ty.slug],
      };
    });
    return [...verticals, ...NAV_TAIL];
  }, [types]);

  const iconBtn = 'grid h-10 w-10 place-items-center rounded-full text-[#1a2e1f] transition hover:bg-black/[0.06]';

  return (
    <>
      {/* announcement bar — solid near-black strip, static (only the navbar
          below is sticky, so this scrolls away naturally). City switcher stays
          left for the city-first delivery UX. */}
      <div className="bg-[#0b1f12] text-sm font-medium text-[#e8f5e9]">
        <div className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-6 py-2">
          <CitySwitcher tone="light" />
          {/* xl+: below that the absolute-centered promo collides with the
              Track Order / Help & Support links on the right */}
          <span className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-2.5 whitespace-nowrap xl:flex">
            <Truck size={15} className="shrink-0 text-sage-300" aria-hidden />
            FREE SHIPPING on orders above ₹499
            <span className="h-3 w-px bg-white/30" />
            Extra 5% OFF on prepaid orders
          </span>
          <span className="flex items-center gap-4">
            <Link href="/track-order" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
              <Truck size={15} aria-hidden />
              Track Order
            </Link>
            <Link href="/help" className="hidden items-center gap-1.5 transition-colors hover:text-white sm:inline-flex">
              <CircleHelp size={15} aria-hidden />
              Help &amp; Support
            </Link>
          </span>
        </div>
      </div>

      <motion.header
        id="site-header"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EXPO }}
        className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/[0.85] backdrop-blur-[12px]"
      >
        {/* main bar */}
        <div className="relative mx-auto flex max-w-[1440px] items-center gap-6 px-6 py-3.5">
          {/* Logo */}
          <Link href="/" aria-label="PlantAtHome home" className="shrink-0">
            <BrandLogo />
          </Link>

          {/* ── nav — centered between logo and actions, flat on the dark bar.
              In-flow (not absolutely centered) so it can never overlap the
              actions block at narrower desktop widths. ── */}
          {/* xl+ only: with 8 verticals the pill row measures ~730px and collides
              with logo/actions through the whole lg range (1024–1210), so
              768–1279 uses the hamburger's full-screen menu instead. */}
          <nav className="hidden min-w-0 flex-1 justify-center xl:flex">
            <div className="flex items-center gap-2">
              {NAV.map((n) =>
                n.menu ? (
                  <div key={n.label} className="group relative">
                    <Link
                      href={n.href}
                      className="inline-flex items-center gap-1 whitespace-nowrap px-1 py-2 text-[0.95rem] font-medium text-[#1a2e1f] transition-colors duration-200 hover:text-[#2e7d32]"
                    >
                      {n.label}
                      <ChevronDown size={12} className="opacity-60 transition-transform duration-200 group-hover:rotate-180" aria-hidden />
                    </Link>
                    {/* dropdown — glass panel */}
                    <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="grid grid-cols-1 gap-0.5 rounded-2xl border border-white/[0.18] bg-white/[0.88] p-1.5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
                        {n.menu.map((m) => (
                          <Link
                            key={m.label}
                            href={m.href}
                            className="rounded-[10px] px-3.5 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-black/[0.06] hover:text-neutral-900"
                          >
                            {m.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={n.label}
                    href={n.href}
                    className={`whitespace-nowrap px-1 py-2 text-[0.95rem] font-medium transition-colors duration-200 hover:text-[#2e7d32] ${
                      n.href === '/offers' ? 'text-[#2e7d32]' : 'text-[#1a2e1f]'
                    }`}
                  >
                    {n.label}
                  </Link>
                ),
              )}
            </div>
          </nav>

          {/* ── actions — right, stacked icon-over-label (per reference) ── */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-1 md:flex">
              {/* Search */}
              <button type="button" onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg text-[#1a2e1f] transition-colors hover:text-[#2e7d32]" aria-label={t('text-search') ?? 'Search'}>
                <SearchIcon className="h-[18px] w-[18px]" />
              </button>
              <span aria-hidden className="mx-1.5 h-6 w-px bg-black/10" />
              {/* Wishlist */}
              <Link href="/wishlists" className="flex flex-col items-center gap-1 px-2.5 py-1 text-[#1a2e1f] transition-colors hover:text-[#2e7d32]" aria-label="Wishlist">
                <Heart size={18} aria-hidden />
                <span className="text-[0.75rem] font-medium leading-none">Wishlist</span>
              </Link>
              {/* Cart */}
              <button ref={cartBtnRef} data-cart-target type="button" onClick={openCart} className="flex flex-col items-center gap-1 px-2.5 py-1 text-[#1a2e1f] transition-colors hover:text-[#2e7d32]" aria-label="Cart">
                <span className="relative">
                  <Icon.bag className="h-[18px] w-[18px]" />
                  <span className="absolute -right-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#2e7d32] px-0.5 text-[0.65rem] font-semibold text-white">
                    {totalUniqueItems}
                  </span>
                </span>
                <span className="text-[0.75rem] font-medium leading-none">Cart</span>
              </button>
              {/* Login */}
              <button type="button" onClick={onProfile} className="flex flex-col items-center gap-1 px-2.5 py-1 text-[#1a2e1f] transition-colors hover:text-[#2e7d32]" aria-label={isAuthorize ? 'My account' : 'Login'}>
                <Icon.user className="h-[18px] w-[18px]" />
                <span className="text-[0.75rem] font-medium leading-none">{isAuthorize ? 'Account' : 'Login'}</span>
              </button>
            </div>

            {/* mobile: search + hamburger */}
            <button type="button" onClick={() => setSearchOpen(true)} className={`${iconBtn} md:hidden`} aria-label={t('text-search') ?? 'Search'}>
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.06] text-[#1a2e1f] xl:hidden" aria-label="Menu">
              <Icon.menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* search overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: EXPO }}
              className="border-t border-black/[0.06] bg-white/[0.96] backdrop-blur-2xl"
            >
              <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 sm:px-8">
                <div className="flex-1">
                  <Search label={t('text-search') ?? 'Search'} variant="minimal" />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-700 hover:bg-black/[0.06]"
                  aria-label="Close search"
                >
                  <Icon.x className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* full-screen mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col overflow-y-auto overscroll-contain bg-forest p-7 text-white"
          >
            <div className="mb-10 flex items-center justify-between">
              <BrandLogo light />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <Icon.x className="h-6 w-6" />
              </button>
            </div>

            {[
              ...NAV,
              { label: 'Search', href: '#search' },
              { label: 'Cart', href: '#cart' },
              { label: isAuthorize ? 'My account' : 'Login', href: '#account' },
            ].map((l, i) => (
              <motion.button
                key={l.label}
                type="button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, ease: EXPO }}
                onClick={() => {
                  setMenuOpen(false);
                  if (l.href === '#search') setSearchOpen(true);
                  else if (l.href === '#cart') openCart();
                  else if (l.href === '#account') onProfile();
                  else router.push(l.href);
                }}
                className="block border-b border-white/10 py-5 text-left font-poppins text-2xl font-bold"
              >
                {l.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
