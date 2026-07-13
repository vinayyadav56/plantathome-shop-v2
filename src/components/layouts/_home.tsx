import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { useAtom } from 'jotai';
import { useState } from 'react';
import Header from './header';
import HeaderMinimal from './header-minimal';
import Footer from '@/components/layouts/footer';
import { SearchIcon } from '@/components/icons/search-icon';
import { displayMobileHeaderSearchAtom } from '@/store/display-mobile-header-search-atom';
import { useIsHomeExperience } from '@/lib/use-is-home-experience';
import dynamic from 'next/dynamic';

const GreenPicker = dynamic(() => import('@/components/storefront/green-picker'), { ssr: false });

const MobileNavigation = dynamic(() => import('./mobile-navigation'), {
  ssr: false,
});

export default function HomeLayout({
  children,
  layout,
}: React.PropsWithChildren<{ layout: string }>) {
  const { t } = useTranslation('common');
  const [, setDisplayMobileHeaderSearch] = useAtom(displayMobileHeaderSearchAtom);
  // On the home experience the mobile (<lg) view is the Claude Design home, which
  // carries its own header + bottom nav — so suppress the prod chrome there.
  // Desktop (>=lg) is unchanged. Verticals / filtering keep the full prod chrome.
  const pahMobile = useIsHomeExperience();

  const headerEl = ['minimal', 'compact'].includes(layout) ? (
    <HeaderMinimal layout={layout} />
  ) : (
    <Header layout={layout} />
  );

  return (
    <div className="flex min-h-screen flex-col transition-colors duration-150" style={{ background: 'var(--pa-bg)' }}>
      {/* Brand header is sticky/solid (see header.tsx). On the home it shows from md+
          (tablet/desktop use the production home); the phone home (<md) carries its
          own app bar, so the prod header is suppressed there. */}
      {pahMobile ? <div className="hidden md:block">{headerEl}</div> : headerEl}

      <main className="min-h-screen flex-1">{children}</main>

      {/* Footer: the shared footer is the DESKTOP "Grow with us" Web Home footer.
          On the phone home (<md) PahHome renders its own Mobile-Home-matched footer,
          so suppress this one there (mirrors the header treatment) to avoid a
          duplicate footer. Desktop home + all other pages keep it. */}
      {pahMobile ? (
        <div className="hidden md:block">
          <Footer />
        </div>
      ) : (
        <Footer />
      )}

      <GreenPicker />

      {/* PahHome renders its own bottom nav on the mobile home; suppress this one there. */}
      {!pahMobile && (
        <MobileNavigation>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setDisplayMobileHeaderSearch((prev) => !prev)}
            className="flex h-full items-center justify-center p-2 focus:text-accent focus:outline-0"
          >
            <span className="sr-only">{t('text-search')}</span>
            <SearchIcon width="17.05" height="18" />
          </motion.button>
        </MobileNavigation>
      )}
    </div>
  );
}
