import type { Metadata } from 'next';
import Script from 'next/script';

// CSS import order mirrors V1 _app.tsx exactly (load-bearing). main.css used to
// @import the next three at its END — Turbopack requires @import at top, so they
// are imported here in the identical cascade position instead.
import '@/assets/css/main.css';
import '@/assets/css/custom-plugins.css';
import '@/assets/css/rich-text-editor.css';
import '@/assets/css/plantathome-overrides.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/assets/css/toast-overrides.css';

import { DS_PREPAINT_SCRIPT } from '@/lib/design-system';
import { TYPO_PREPAINT_SCRIPT } from '@/lib/typography';
import AppProviders from '@/app-shell/app-providers';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plantathome.in'
).replace(/\/$/, '');

export const metadata: Metadata = {
  // metadataBase makes every relative canonical/og URL in child routes
  // resolve against the real host — there was none before, so no route
  // emitted a canonical at all.
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PlantAtHome — Premium Plants Delivered',
    template: '%s | PlantAtHome',
  },
  description:
    'Bring Nature Home — plants, tools & farm-fresh produce delivered.',
  openGraph: {
    type: 'website',
    siteName: 'PlantAtHome',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image' },
};

/**
 * Root shell — App Router port of V1's _document.tsx + _app.tsx chrome.
 * Fonts stay as Google <link>s (V1-identical rendering; React 19 hoists
 * stylesheet links to <head>). Font Awesome 6.5.2 CDN backs the pah mobile
 * home's fa-* icons.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The ds-prepaint script below mutates <html> (data-density + --ds-* inline
    // styles from the PERSISTED design system) before React hydrates, so from
    // the second page load onward hydration would flag an attribute mismatch.
    // Standard theme-script pattern (same as next-themes): suppress on <html>
    // only — children still hydrate strictly.
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Apply persisted Design System theme (font/color) before paint. */}
        <Script id="ds-prepaint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: DS_PREPAINT_SCRIPT }} />
        {/* Apply the single website font (default Inter) AFTER the design system,
            so headings + content share one typeface with no flash. */}
        <Script id="typo-prepaint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: TYPO_PREPAINT_SCRIPT }} />

        {/* Google Fonts — V1 _document.tsx set, verbatim */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;0,900;1,500;1,600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Caveat:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Font Awesome 6.5.2 — icon system used by the mobile home (fa-solid …) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />

        {/* Google Analytics (V1 _document.tsx) */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-KTCXX5B35N" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KTCXX5B35N');`}
        </Script>

        {/*
          Skip link — WCAG 2.4.1 (Bypass Blocks). There was none, so a keyboard
          or screen-reader user had to tab through the full header, search,
          city picker and mega-nav on EVERY page before reaching content.
          First focusable element in <body> on purpose; visually hidden until
          focused. Targets #main-content, which the layouts set on their <main>.
        */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-forest-700 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to content
        </a>

        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
