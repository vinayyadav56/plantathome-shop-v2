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
import { Routes } from '@/config/routes';
import CitySwitcher from '@/components/location/city-switcher';
import { useTypes } from '@/framework/type';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import { POPULAR_PLANT_CATEGORIES, getVerticalMeta } from '@/components/storefront/verticals';
import Search from '@/components/ui/search/search';
import { ChevronDown, Heart, Truck } from '@/components/ui/icon';



type NavItem = { label: string; href: string; menu?: { label: string; href: string }[] };

// Vertical nav entries are built at render time from the API types (city-aware,
// works on any catalogue — staging's 6 verticals AND production's 3, whose slugs
// differ, e.g. farm-box). Only the dropdown CONTENTS are curated here, keyed by
// type slug with REAL category slugs (verified against the live catalogue — the
// old hardcoded list had guessed slugs that 404'd). A type without an entry
// simply renders as a plain link.
const CATEGORY_MENUS: Record<string, { label: string; href: string }[]> = {
  plants: [
    ...POPULAR_PLANT_CATEGORIES,
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
 * PlantAtHome brand header — one sticky, full-width warm-glass bar: logo,
 * centred nav, the shopping-city chip, search, track order, wishlist, cart and
 * profile. (The dark-green announcement strip that used to sit above a floating
 * pill is gone — owner annotation 2026-10-05.) Wired to the real cart drawer,
 * login + search.
 */
const noopSubscribe = () => () => {};

const Header = ({ layout }: { layout?: string }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { totalUniqueItems } = useCart();
  const [, setDrawer] = useAtom(drawerAtom);
  const [isAuthorize] = useAtom(authorizationAtom);
  // authorizationAtom reads the login cookie at module load: false on the server, true in a
  // signed-in browser. Rendering it straight into the label made the server say "Login" and the
  // first client render say "Account" — React #418 on every page load, and the whole header
  // regenerated client-side. Show the signed-in label only once hydrated so both renders agree.
  const hydrated = React.useSyncExternalStore(noopSubscribe, () => true, () => false);
  const signedIn = hydrated && isAuthorize;
  const { openModal } = useModalAction();

  const [searchOpen, setSearchOpen] = useAtom(displayMobileHeaderSearchAtom);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // The collapse-on-scroll slim bar is GONE, and with it the only mechanism
  // that could hide the shopping-city chip. It swapped the pill for a slim bar
  // at `scrollY > 150 && innerWidth < 768`, which meant: nothing carried the
  // city between ~45px (where the static announcement strip scrolls away) and
  // 150px, and at >=768px — desktop, and a large phone in LANDSCAPE — the bar
  // could never appear at all, so the city vanished for the rest of the
  // session. The header is pure CSS now: one sticky bar at every width. It
  // cannot flicker at a threshold and cannot differ between server and client.

  // The cart icon lands on the /cart page (annotation: dedicated cart page).
  // The drawer still opens as add-to-cart confirmation via `pah-open-cart`.
  const openCart = () => router.push(Routes.cart);

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

  // The vertical you're on stays lit (owner mock: "Tools" underlined on /tools).
  // router.pathname is usePathname(): the real path, identical on the server and
  // the client (no page rewrites; '/index' is normalised), so this SSRs with no
  // #418, exactly like the bottom nav's active pill. '#…' drawer actions never match.
  const isActive = (href: string) =>
    !!href && href !== '/' && (router.pathname === href || router.pathname.startsWith(`${href}/`));

  const iconBtn = 'grid h-10 w-10 place-items-center rounded-full text-[#1a2e1f] transition hover:bg-black/[0.06]';

  return (
    <>
      {/* Plain <header>, deliberately NOT a motion element: framer SSRs the
          entrance's initial state (opacity:0, translateY) into the HTML, so
          the navbar painted blank until hydration.

          Annotation 2026-10-05: the green strip is gone — one full-width sticky
          bar carries the city chip and Track Order itself, so the city stays
          reachable at every scroll offset (pinned by e2e/city-chip.spec.ts). */}
      <header
        id="site-header"
        className="pointer-events-none sticky top-0 z-50 w-full"
      >
        {/* full-width warm-glass bar. NOT overflow-hidden — the dropdown menus
            render inside it and would be clipped; the shine lives in its own
            clipped child span instead. */}
        <div className="pointer-events-auto relative flex h-[58px] w-full items-center gap-3 border-b border-white/[0.72] bg-[linear-gradient(110deg,rgba(255,255,255,0.88)_0%,rgba(248,247,241,0.78)_48%,rgba(255,255,255,0.84)_100%)] px-4 shadow-box backdrop-blur-[22px] backdrop-saturate-[1.35] transition-shadow duration-300 md:gap-4 md:px-6 lg:h-[68px] lg:gap-6 lg:px-10 xl:px-12">
          {/* glass shine — top-half highlight, clipped to the bar */}
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.38),transparent)]" />
          </span>
          {/* BrandLogo paints into a fixed 160px box, but the artwork is ~67px
              wide at 44px tall — ~90px of nothing beside it. Both spans size
              the image to its own aspect instead (w-auto); on desktop that
              reclaimed width is what pays for the city chip + Track Order now
              living in this bar. */}
          <Link href="/" aria-label="PlantAtHome home" className="shrink-0">
            {/* Full wordmark at every width (annotation): capped on phones so it
                shares the bar with the city chip + icons. */}
            <span className="inline-block max-w-[118px] md:hidden [&_img]:h-8 [&_img]:w-auto [&_img]:object-contain">
              <BrandLogo />
            </span>
            <span className="hidden md:inline-block [&_img]:h-11 [&_img]:w-auto [&_img]:max-w-[160px] [&_img]:object-contain">
              <BrandLogo />
            </span>
          </Link>

          {/* ── nav — centered between logo and actions, flat on the dark bar.
              In-flow (not absolutely centered) so it can never overlap the
              actions block at narrower desktop widths. ── */}
          {/* Shown from md (annotation: menu should be there on tablet too).
              The full row does not fit below xl, so it DEGRADES instead of
              vanishing into a hamburger: 2 items + "More" below lg, 4 + "More"
              from lg, the full row at xl. Action labels also drop to icons
              below xl, and 1280–1439 keeps the smaller text + tighter gaps.
              These cuts are MEASURED against the bar as it is now (city chip +
              Track Order inside it, logo sized to its artwork) with staging's
              7-item nav and the longest city label: the tightest fit is ~37px
              of clearance either side of the nav at 1440. Adding a nav item or
              an action means re-measuring every width, not just eyeballing one. */}
          <nav className="relative z-[2] hidden min-w-0 flex-1 justify-center md:flex">
            <div className="flex items-center gap-3.5 min-[1440px]:gap-[34px]">
              {NAV.map((n, i) => {
                // Fixed split — deterministic, no measurement loop (see above).
                // Was `i < 2 ? ''` — two items inline from md. Those cost ~160px at exactly the
                // widths where the action icons ran out of room (iPad portrait, 768–834). Below
                // lg the nav is now the "More" menu alone, which is still a menu on tablet.
                const reveal = i < 4 ? 'hidden lg:block' : 'hidden xl:block';
                // after:w-[55%] is emitted after NAV_UNDERLINE's after:w-0 (Tailwind
                // sorts candidates), so the active underline wins without !important.
                const active = isActive(n.href);
                return n.menu ? (
                  <div key={n.label} className={`group relative ${reveal}`}>
                    <Link
                      href={n.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative inline-flex items-center gap-[7px] whitespace-nowrap py-2 text-[13.5px] font-medium transition-colors duration-200 hover:text-[#397b2a] min-[1440px]:text-[15px] ${NAV_UNDERLINE} ${
                        active ? 'text-forest-700 after:w-[55%]' : 'text-[#1d2b20]'
                      }`}
                    >
                      {n.label}
                      <ChevronDown size={12} className="opacity-60 transition-transform duration-200 group-hover:rotate-180" aria-hidden />
                    </Link>
                    {/* dropdown — glass panel */}
                    <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="grid grid-cols-1 gap-0.5 rounded-2xl border border-white/[0.18] bg-white/[0.88] p-1.5 shadow-box backdrop-blur-2xl">
                        {n.menu.map((m) => (
                          <Link
                            key={m.label}
                            href={m.href}
                            className="rounded px-3.5 py-2 text-[13px] font-medium text-neutral-700 transition hover:bg-black/[0.06] hover:text-neutral-900"
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
                    aria-current={active ? 'page' : undefined}
                    className={`relative whitespace-nowrap py-2 text-[13.5px] font-medium transition-colors duration-200 hover:text-[#397b2a] min-[1440px]:text-[15px] ${NAV_UNDERLINE} ${reveal} ${
                      active ? 'text-forest-700 after:w-[55%]' : n.href === '/offers' ? 'text-[#397b2a]' : 'text-[#1d2b20]'
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}

              {/* Overflow menu — carries whatever the row is hiding at this
                  width. Below lg it carries the WHOLE nav (the inline row is empty
                  there); from lg the first four move inline and hide here; the
                  whole control disappears at xl. */}
              {NAV.length > 0 ? (
                <div className="group relative xl:hidden">
                  <button
                    type="button"
                    className={`relative inline-flex items-center gap-[7px] whitespace-nowrap py-2 text-[13.5px] font-medium text-[#1d2b20] transition-colors duration-200 hover:text-[#397b2a] ${NAV_UNDERLINE}`}
                    aria-haspopup="true"
                  >
                    More
                    <ChevronDown size={12} className="opacity-60 transition-transform duration-200 group-hover:rotate-180" aria-hidden />
                  </button>
                  <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="grid grid-cols-1 gap-0.5 rounded-2xl border border-white/[0.18] bg-white/[0.88] p-1.5 shadow-box backdrop-blur-2xl">
                      {/* Every item below lg — the inline row is empty there now, so slicing the
                          first two off would have made them unreachable on iPad. From lg the
                          first four move inline, so they hide here instead. */}
                      {NAV.map((n, i) => (
                        <Link
                          key={n.label}
                          href={n.href}
                          aria-current={isActive(n.href) ? 'page' : undefined}
                          className={`rounded px-3.5 py-2 text-[13px] font-medium transition hover:bg-black/[0.06] ${
                            isActive(n.href) ? 'bg-black/[0.04] text-forest-700' : 'text-neutral-700 hover:text-neutral-900'
                          } ${i < 4 ? 'lg:hidden' : ''}`}
                        >
                          {n.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </nav>

          {/* ── actions — right, stacked icon-over-label (per reference).
              Below xl the labels drop away (icons only): they cost ~90px, and
              at 768–1279 that width is what lets the nav row exist at all. ── */}
          {/* shrink-0: the actions must never be the thing that gives way. Without it the nav
              (flex-1) kept its width and these icons were squeezed off the row — on iPad only
              the city chip and search survived, which is the "only two are coming" report. The
              nav degrades by breakpoint instead, which it was already built to do. */}
          <div className="relative z-[2] ml-auto flex shrink-0 items-center gap-2.5 md:gap-3">
            {/* The ONE city chip, every width (e2e/city-chip.spec.ts). */}
            <CitySwitcher className="max-w-[7rem] md:max-w-[8.5rem] lg:max-w-[9rem] xl:max-w-[11rem] min-[1440px]:max-w-[14rem]" />
            <div className="hidden items-center gap-2.5 md:flex lg:gap-3.5 xl:gap-4">
              {/* Search */}
              <button type="button" onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label={t('text-search') ?? 'Search'}>
                <SearchIcon className="h-[21px] w-[21px]" />
              </button>
              <span aria-hidden className="h-10 w-px bg-[linear-gradient(to_bottom,transparent,rgba(24,50,29,0.18),transparent)]" />
              {/* Track order — moved in from the retired green strip */}
              <Link href="/track-order" className="flex flex-col items-center gap-1.5 px-1 py-1 text-[12px] font-medium text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label="Track order">
                <Truck size={24} aria-hidden />
                <span className="hidden leading-none xl:block">Track</span>
              </Link>
              {/* Wishlist */}
              <Link href="/wishlists" className="flex flex-col items-center gap-1.5 px-1 py-1 text-[12px] font-medium text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label="Wishlist">
                <Heart size={24} aria-hidden />
                <span className="hidden leading-none xl:block">Wishlist</span>
              </Link>
              {/* Cart */}
              <button ref={cartBtnRef} data-cart-target type="button" onClick={openCart} className="flex flex-col items-center gap-1.5 px-1 py-1 text-[12px] font-medium text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label="Cart">
                <span className="relative">
                  <Icon.bag className="h-[23px] w-[23px]" />
                  <span className="absolute -right-[9px] -top-[7px] flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white/90 bg-[linear-gradient(135deg,#5b9e35,#7fc54a)] px-[5px] text-[10px] font-bold text-white shadow-[0_3px_8px_rgba(55,130,40,0.3)]">
                    {totalUniqueItems}
                  </span>
                </span>
                <span className="hidden leading-none xl:block">Cart</span>
              </button>
              {/* Login */}
              <button type="button" onClick={onProfile} className="flex flex-col items-center gap-1.5 px-1 py-1 text-[12px] font-medium text-[#18271c] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#4d9433]" aria-label={signedIn ? 'My account' : 'Login'}>
                <Icon.user className="h-[23px] w-[23px]" />
                <span className="hidden leading-none xl:block">{signedIn ? 'Account' : 'Login'}</span>
              </button>
            </div>

            {/* mobile: search + hamburger (the city chip is above, shared) */}
            <button type="button" onClick={() => setSearchOpen(true)} className={`${iconBtn} md:hidden`} aria-label={t('text-search') ?? 'Search'}>
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.06] text-[#1a2e1f] md:hidden" aria-label="Menu">
              <Icon.menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* search overlay — its own floating glass panel below the bar (the
            fixed-height bar can't grow to contain it) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: EXPO }}
              className="pointer-events-auto mx-auto mt-2 max-w-[1360px] rounded border border-white/[0.72] bg-[linear-gradient(110deg,rgba(255,255,255,0.94)_0%,rgba(248,247,241,0.88)_48%,rgba(255,255,255,0.92)_100%)] shadow-box backdrop-blur-[22px] backdrop-saturate-[1.35]"
            >
              <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 sm:px-8">
                <div className="flex-1">
                  <Search label={t('text-search') ?? 'Search'} variant="minimal" onSubmitted={() => setSearchOpen(false)} />
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
            className="fixed inset-0 z-[70] flex flex-col overflow-y-auto overscroll-contain bg-cream-50 p-6 text-forest-900"
          >
            <div className="mb-10 flex items-center justify-between">
              <BrandLogo />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="text-forest-900">
                <Icon.x className="h-6 w-6" />
              </button>
            </div>

            {[
              ...NAV,
              { label: 'Search', href: '#search' },
              { label: 'Cart', href: Routes.cart },
              { label: signedIn ? 'My account' : 'Login', href: '#account' },
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
                  else if (l.href === '#account') onProfile();
                  else router.push(l.href);
                }}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`block border-b border-black/10 py-3.5 text-left font-poppins text-lg font-semibold ${
                  isActive(l.href) ? 'text-forest-700' : ''
                }`}
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
