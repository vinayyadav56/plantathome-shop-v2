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

// Gradient underline that grows from the center on hover (design spec §5).
const NAV_UNDERLINE =
  'after:absolute after:bottom-[3px] after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-[linear-gradient(90deg,#70b943,#9bd85d)] after:transition-all after:duration-300 hover:after:w-[55%]';

/**
 * PlantAtHome brand header — gradient dark-green announcement strip (static,
 * scrolls away) over a sticky floating warm-glass pill with centred nav,
 * inline search, profile + cart. Wired to the real cart drawer, login + search.
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
      {/* announcement bar — dark-green gradient strip with a faint lime glow,
          static (only the glass pill below is sticky, so this scrolls away
          naturally). City switcher stays left for the city-first delivery UX. */}
      <div className="relative h-12 border-b border-[rgba(159,211,111,0.12)] bg-[linear-gradient(90deg,#071b0f_0%,#0a2916_45%,#071b0f_100%)] text-[13px] font-normal text-white/[0.92] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_-100%,rgba(113,190,70,0.18),transparent_55%)]">
        {/* overflow-hidden + min-w-0 cells: nothing may spill out of the 48px
            bar at any width — cells truncate/hide instead (annotation). */}
        <div className="relative z-[1] mx-auto grid h-full max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center overflow-hidden px-5 sm:px-8 xl:px-12">
          <span className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
            <span className="hidden text-white/70 sm:inline">Delivering to</span>
            <CitySwitcher tone="light" />
          </span>
          {/* center — true grid centering; xl+ only so it never crowds the
              links; the second promo needs the full 1440 to fit alongside */}
          <span className="hidden min-w-0 items-center gap-[22px] whitespace-nowrap tracking-[0.1px] xl:flex">
            <span className="inline-flex items-center gap-2.5">
              <Truck size={15} className="shrink-0 text-sage-300" aria-hidden />
              FREE SHIPPING on orders above ₹499
            </span>
            <span aria-hidden className="hidden h-[18px] w-px bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.35),transparent)] min-[1440px]:block" />
            <span className="hidden min-[1440px]:inline">Extra 5% OFF on prepaid orders</span>
          </span>
          <span className="col-start-3 flex shrink-0 items-center justify-end gap-3 whitespace-nowrap sm:gap-[22px]">
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

      {/* Plain <header>, deliberately NOT a motion element: framer SSRs the
          entrance's initial state (opacity:0, translateY) into the HTML, so
          the navbar painted blank until hydration. -mt tucks the pill close
          under the announcement bar. */}
      <header
        id="site-header"
        className="pointer-events-none sticky top-2 z-50 -mt-1.5 w-full px-5"
      >
        {/* floating warm-glass pill. NOT overflow-hidden — the dropdown menus
            render inside it and would be clipped; the shine lives in its own
            clipped child span instead. */}
        <div className="pointer-events-auto relative mx-auto flex h-[58px] max-w-[1580px] items-center gap-6 rounded-[18px] border border-white/[0.72] bg-[linear-gradient(110deg,rgba(255,255,255,0.88)_0%,rgba(248,247,241,0.78)_48%,rgba(255,255,255,0.84)_100%)] px-6 shadow-[0_18px_45px_rgba(5,24,10,0.12),0_2px_8px_rgba(5,24,10,0.05),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-[22px] backdrop-saturate-[1.35] transition-shadow duration-300 lg:h-[78px] lg:px-[42px]">
          {/* glass shine — top-half highlight, clipped to the pill radius */}
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px]">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)]" />
          </span>
          {/* Logo — deliberately NOT position:relative/z-indexed: a stacking
              context here would isolate the img's mix-blend-multiply (which
              melts the asset's white background) from the glass behind it. */}
          <Link href="/" aria-label="PlantAtHome home" className="shrink-0">
            <BrandLogo />
          </Link>

          {/* ── nav — centered between logo and actions, flat on the dark bar.
              In-flow (not absolutely centered) so it can never overlap the
              actions block at narrower desktop widths. ── */}
          {/* xl+ only: with 8 verticals the pill row measures ~730px and collides
              with logo/actions through the whole lg range (1024–1210), so
              768–1279 uses the hamburger's full-screen menu instead. */}
          <nav className="relative z-[2] hidden min-w-0 flex-1 justify-center xl:flex">
            <div className="flex items-center gap-5 min-[1440px]:gap-[34px]">
              {NAV.map((n) =>
                n.menu ? (
                  <div key={n.label} className="group relative">
                    <Link
                      href={n.href}
                      className={`relative inline-flex items-center gap-[7px] whitespace-nowrap py-2 text-[15px] font-medium transition-colors duration-200 hover:text-[#397b2a] ${NAV_UNDERLINE} text-[#1d2b20]`}
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
                    className={`relative whitespace-nowrap py-2 text-[15px] font-medium transition-colors duration-200 hover:text-[#397b2a] ${NAV_UNDERLINE} ${
                      n.href === '/offers' ? 'text-[#397b2a]' : 'text-[#1d2b20]'
                    }`}
                  >
                    {n.label}
                  </Link>
                ),
              )}
            </div>
          </nav>

          {/* ── actions — right, stacked icon-over-label (per reference) ── */}
          <div className="relative z-[2] ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-4 md:flex">
              {/* Search */}
              <button type="button" onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label={t('text-search') ?? 'Search'}>
                <SearchIcon className="h-[21px] w-[21px]" />
              </button>
              <span aria-hidden className="h-10 w-px bg-[linear-gradient(to_bottom,transparent,rgba(24,50,29,0.18),transparent)]" />
              {/* Wishlist */}
              <Link href="/wishlists" className="flex flex-col items-center gap-1.5 px-1 py-1 text-[12px] font-medium text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label="Wishlist">
                <Heart size={23} strokeWidth={1.7} aria-hidden />
                <span className="leading-none">Wishlist</span>
              </Link>
              {/* Cart */}
              <button ref={cartBtnRef} data-cart-target type="button" onClick={openCart} className="flex flex-col items-center gap-1.5 px-1 py-1 text-[12px] font-medium text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label="Cart">
                <span className="relative">
                  <Icon.bag className="h-[23px] w-[23px]" />
                  <span className="absolute -right-[9px] -top-[7px] flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white/90 bg-[linear-gradient(135deg,#5b9e35,#7fc54a)] px-[5px] text-[10px] font-bold text-white shadow-[0_3px_8px_rgba(55,130,40,0.3)]">
                    {totalUniqueItems}
                  </span>
                </span>
                <span className="leading-none">Cart</span>
              </button>
              {/* Login */}
              <button type="button" onClick={onProfile} className="flex flex-col items-center gap-1.5 px-1 py-1 text-[12px] font-medium text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label={isAuthorize ? 'My account' : 'Login'}>
                <Icon.user className="h-[23px] w-[23px]" />
                <span className="leading-none">{isAuthorize ? 'Account' : 'Login'}</span>
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

        {/* search overlay — its own floating glass panel below the pill (the
            fixed-height pill can't grow to contain it) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: EXPO }}
              className="pointer-events-auto mx-auto mt-2 max-w-[1580px] rounded-[18px] border border-white/[0.72] bg-[linear-gradient(110deg,rgba(255,255,255,0.94)_0%,rgba(248,247,241,0.88)_48%,rgba(255,255,255,0.92)_100%)] shadow-[0_18px_45px_rgba(5,24,10,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-[22px] backdrop-saturate-[1.35]"
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
      </header>

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
