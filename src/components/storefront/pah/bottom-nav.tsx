'use client';
import React from 'react';
import { goToSignin } from '@/lib/go-to-signin';
import { useRouter } from '@/compat/next-router';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { authorizationAtom } from '@/store/authorization-atom';
import { drawerAtom } from '@/store/drawer-atom';
import { useModalAction } from '@/components/ui/modal/modal.context';

const ACCENT = '#2E5E2A';
const MUTED = '#8A8A82';

/**
 * Modern mobile bottom tab bar — a clean full-width bar where the active tab
 * lifts on a soft forest pill (Material-3 / native-app feel) with an accent
 * colour + slightly heavier stroke. Rendered mobile-only (md:hidden).
 */
const ICONS: Record<string, React.ReactNode> = {
  Home: <><path d="M3 11 12 4l9 7" /><path d="M5.5 9.5V20h13V9.5" /></>,
  Categories: <><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="3.5" cy="6" r="1.2" /><circle cx="3.5" cy="12" r="1.2" /><circle cx="3.5" cy="18" r="1.2" /></>,
  Plants: <><path d="M12 21V11" /><path d="M12 11c0-3.4 2.4-5.8 6-6.3C17.5 8 15.4 11 12 11Z" /><path d="M12 13c0-2.8-1.9-4.8-5-5.2C6.6 11 9 13 12 13Z" /></>,
  Wishlist: <path d="M12 20s-7-4.4-9.2-9C1.3 8.1 2.6 5 5.8 5 8 5 9.4 6.6 12 9c2.6-2.4 4-4 6.2-4 3.2 0 4.5 3.1 3 6-2.2 4.6-9.2 9-9.2 9Z" />,
  Profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-3.6 4-5 7-5s6 1.4 7 5" /></>,
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
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                className="relative"
                fill="none"
                stroke="currentColor"
                strokeWidth={n.active ? 2 : 1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: n.active ? ACCENT : MUTED }}
              >
                {ICONS[n.label]}
              </svg>
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
