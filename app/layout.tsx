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
import AppProviders from '@/app-shell/app-providers';

export const metadata: Metadata = {
  title: 'PlantAtHome',
  description: 'Bring Nature Home — plants, tools & farm-fresh produce delivered.',
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

        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
