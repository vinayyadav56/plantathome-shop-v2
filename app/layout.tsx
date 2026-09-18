import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cache } from 'react';
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
 * Settings, fetched ONCE per request (React `cache` dedupes) and used for two
 * things: the metadata below, and seeding the QueryClient in AppProviders.
 *
 * The seeding is the important half. Every settings-driven component
 * (BrandLogo, the hero, DesignSystemApplier, Maintenance) falls back to a
 * hardcoded default when settings are absent — and they WERE absent on the
 * server, because AppProviders renders two `useSettings()` consumers before
 * {children}, which creates the query before the page's <Hydrate> runs, and
 * TanStack then defers hydrating a pre-existing query to an effect. Effects do
 * not run during SSR, so the server shipped the fallback wordmark and the
 * built-in hero images, and the client swapped in the real ones after
 * hydration. That swap is what shoppers saw as "old logo, then new logo".
 *
 * 30s matches the home route's revalidate, so an admin logo change reaches the
 * server-rendered HTML within one window instead of never.
 */
export const getSettings = cache(async (): Promise<any | null> => {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/settings`, { next: { revalidate: 30 } });
    return res.ok ? await res.json() : null;
  } catch {
    // A down API must not break the page — components fall back exactly as before.
    return null;
  }
});

/**
 * Root metadata is BUILT from admin Settings → SEO when values are set there
 * (metaTitle, metaDescription, ogImage, twitterHandle) and falls back to the
 * literals below. This used to be DefaultSeo's job — dead since the next-seo
 * shim (src/compat/next-seo.tsx renders null), which silently disconnected
 * the admin SEO panel from the live site.
 */
export async function generateMetadata(): Promise<Metadata> {
  const options = (await getSettings())?.options;
  const seo: any = options?.seo ?? null;
  const favicon: string | undefined = options?.favicon?.original || undefined;

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
/**
 * Inter, self-hosted and preloaded by next/font instead of a render-blocking
 * <link> to fonts.googleapis.com. That stylesheet sat on the critical path of
 * every page: a fresh DNS + TCP + TLS handshake to a third-party origin before
 * the browser could even start the font, which on a 150 ms-RTT mobile link is
 * most of a second of FCP.
 *
 * Variable axis, so it is ONE woff2 covering every weight the app uses (400,
 * 500, 600, 700, with occasional 300/800/900) rather than seven static files.
 * Exposed as --font-inter; src/lib/typography.ts leads its stacks with that
 * variable and refuses to re-fetch Inter from Google — see BUNDLED_FONT there.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    // The ds-prepaint script below mutates <html> (data-density + --ds-* inline
    // styles from the PERSISTED design system) before React hydrates, so from
    // the second page load onward hydration would flag an attribute mismatch.
    // Standard theme-script pattern (same as next-themes): suppress on <html>
    // only — children still hydrate strictly.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        {/* Apply persisted Design System theme (font/color) before paint. */}
        <Script id="ds-prepaint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: DS_PREPAINT_SCRIPT }} />
        {/* Apply the single website font (default Inter) AFTER the design system,
            so headings + content share one typeface with no flash. */}
        <Script id="typo-prepaint" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: TYPO_PREPAINT_SCRIPT }} />

        {/* The Google Fonts <link> and its two preconnects used to live here.
            Inter is now bundled (see the next/font instance above), so there is
            no third-party origin on the critical path at all. The id below is
            load-bearing: both TYPO_PREPAINT_SCRIPT and ensureFontLoaded dedupe
            font injection by `pah-font-<family>`, and this marker keeps them
            from re-adding the very request we just removed. They also check the
            family name directly, so this is belt and braces. */}
        <meta id="pah-font-inter" name="pah-bundled-font" content="Inter" />
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

        <AppProviders settings={settings}>{children}</AppProviders>
      </body>
    </html>
  );
}
