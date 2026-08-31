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
import { API_URL, SITE_URL } from '@/lib/site-url';

/**
 * Root metadata is BUILT from admin Settings → SEO when values are set there
 * (metaTitle, metaDescription, ogImage, twitterHandle) and falls back to the
 * literals below. This used to be DefaultSeo's job — dead since the next-seo
 * shim (src/compat/next-seo.tsx renders null), which silently disconnected
 * the admin SEO panel from the live site.
 */
export async function generateMetadata(): Promise<Metadata> {
  let seo: any = null;
  let favicon: string | undefined;
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 300 } });
      if (res.ok) {
        const options = (await res.json())?.options;
        seo = options?.seo ?? null;
        favicon = options?.favicon?.original || undefined;
      }
    } catch {
      /* fall back to the literals — a down API must not break metadata */
    }
  }

  return {
    // metadataBase makes every relative canonical/og URL in child routes
    // resolve against the real host — there was none before, so no route
    // emitted a canonical at all.
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo?.metaTitle || 'PlantAtHome — Premium Plants Delivered',
      template: '%s | PlantAtHome',
    },
    description:
      seo?.metaDescription ||
      'Buy plants online in India — indoor & outdoor plants, pots, tools and farm-fresh produce, hand-checked and delivered to your doorstep.',
    ...(seo?.metaTags ? { keywords: seo.metaTags } : {}),
    openGraph: {
      type: 'website',
      siteName: 'PlantAtHome',
      locale: 'en_IN',
      ...(seo?.ogImage?.original ? { images: [seo.ogImage.original] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(seo?.twitterHandle
        ? { site: seo.twitterHandle.startsWith('@') ? seo.twitterHandle : `@${seo.twitterHandle}` }
        : {}),
    },
    // Favicon/manifest links also died with DefaultSeo; admin favicon wins.
    icons: favicon
      ? { icon: favicon }
      : {
          icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/icons/favicon-32.png', type: 'image/png', sizes: '32x32' },
          ],
          apple: '/icons/apple-icon-180.png',
        },
    manifest: '/manifest.json',
  };
}

export const viewport = {
  themeColor: '#0D3B2E', // same value the (dead) DefaultSeo carried
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

        {/* Inter is the global body font — load it as a REAL document stylesheet so the
            first paint uses it (the prepaint script alone injected it late = FOUT). The id
            matches the script's `pah-font-inter`, so it won't inject a duplicate; a custom
            admin font still overrides via the prepaint. The old link here loaded Hanken
            Grotesk + Jost, faces nothing resolves to anymore — dead weight on every page. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          id="pah-font-inter"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
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
