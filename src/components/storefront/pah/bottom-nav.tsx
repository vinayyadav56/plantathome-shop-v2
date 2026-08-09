'use client';
import React from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import { useRouter } from '@/compat/next-router';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { authorizationAtom } from '@/store/authorization-atom';
import { drawerAtom } from '@/store/drawer-atom';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { Heart, Home, LayoutGrid, Leaf, User, type LucideIcon } from '@/components/ui/icon';

const ACCENT = '#2E5E2A';
const MUTED = '#8A8A82';

/**
 * Modern mobile bottom tab bar — a clean full-width bar where the active tab
 * lifts on a soft forest pill (Material-3 / native-app feel) with an accent
 * colour. Rendered mobile-only (md:hidden).
 */
const ICONS: Record<string, LucideIcon> = {
  Home: Home,
  Categories: LayoutGrid,
  Plants: Leaf,
  Wishlist: Heart,
  Profile: User,
};

export function BottomNav() {
  const router = useRouter();
  const [authorized] = useAtom(authorizationAtom);
  const [, setDrawer] = useAtom(drawerAtom);
  const { openModal } = useModalAction();
  const path = (router.asPath || '/').split(/[?#]/)[0];

  const items = [
    { label: 'Home', active: path === '/', go: () => router.push('/') },
    { label: 'Categories', active: path.startsWith('/c/'), go: () => setDrawer({ display: true, view: 'MAIN_MENU_VIEW' }) },
    { label: 'Plants', active: path.startsWith('/plants') || path.startsWith('/products'), go: () => router.push('/plants') },
    { label: 'Wishlist', active: path.startsWith('/wishlist'), go: () => (authorized ? router.push('/wishlists') : goToSignin()) },
    { label: 'Profile', active: path.startsWith('/profile') || path.startsWith('/orders'), go: () => (authorized ? router.push('/profile') : goToSignin()) },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-30 w-full border-t border-kraft-200/80 bg-white/95 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_28px_rgba(34,48,26,0.10)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-[440px] items-stretch">
        {items.map((n) => (
          <motion.button
            key={n.label}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={n.go}
            aria-label={n.label}
            aria-current={n.active ? 'page' : undefined}
            className="relative flex flex-1 select-none flex-col items-center justify-center gap-[3px] pb-0.5 pt-1"
          >
            {/* icon + sliding active pill */}
            <span className="relative flex h-8 w-[52px] items-center justify-center">
              {n.active && (
                <motion.span
                  layoutId="pah-nav-pill"
                  transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-[#E7F2E1]"
                />
              )}
              {(() => {
                const Glyph = ICONS[n.label];
                return (
                  <Glyph
                    size={24}
                    strokeWidth={2}
                    className="relative"
                    style={{ color: n.active ? ACCENT : MUTED }}
                    aria-hidden
                  />
                );
              })()}
            </span>
            <span
              className="text-[10.5px] leading-none"
              style={{ color: n.active ? ACCENT : MUTED, fontWeight: n.active ? 700 : 500 }}
            >
              {n.label}
            </span>
          </motion.button>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
