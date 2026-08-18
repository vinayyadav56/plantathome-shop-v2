import type { NextConfig } from 'next';

/**
 * plantathome-shop — V1 pixel-port on Next 16 App Router.
 * API + image + proxy config mirror V1's next.config.js; compat module aliases
 * back the tsconfig path redirects at the bundler level (Turbopack).
 */

/**
 * Content-Security-Policy, ENFORCED.
 *
 * Every origin below was observed on the live site with a real browser rather than guessed —
 * that is the difference between a CSP that ships and one that breaks checkout on a Saturday.
 * Google Fonts, Font Awesome via cdnjs, GTM + GA4, Cloudflare Insights and the RUM beacon,
 * and Unsplash imagery all appear on the home page today. Razorpay and Google Maps are added
 * for the checkout and location-picker flows, which the crawl did not exercise.
 *
 * Honest about what this does and does not buy:
 *  - script-src keeps 'unsafe-inline'/'unsafe-eval' because Next's App Router bootstraps from
 *    inline scripts and there is no nonce plumbing here. So this is NOT a strong anti-XSS
 *    control. What it does do is bound WHERE script may come from and — via connect-src —
 *    where a compromised page may send data, which is the half that limits token exfiltration
 *    (see src/lib/cookie-options.ts on why the auth cookie is readable by script).
 *  - img-src allows https: broadly on purpose: product imagery is served from S3, several
 *    CDNs and editorial hosts, and an allowlist there would break the catalogue for no real
 *    gain — images are not an execution sink.
 *
 * frame-ancestors 'none' is the clickjacking control; X-Frame-Options below repeats it for
 * older browsers that ignore the CSP directive.
 */
/**
 * Agentation (the on-page annotation overlay) talks to a local companion on :4747 and is
 * default-ON outside production. An enforced connect-src blocks it — verified on staging, where
 * it was the ONLY thing the CSP broke. Allowed on non-production builds only; the production
 * domain never gets a localhost origin in its policy.
 */
const IS_PRODUCTION_SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? '').includes('plantathome.in');
const AGENTATION_CONNECT = IS_PRODUCTION_SITE
  ? ''
  : ' http://localhost:4747 http://127.0.0.1:4747 ws://localhost:4747';

const CSP = [
  "default-src 'self'",
  // `blob:` + worker-src: current Maps JS builds instantiate the Places autocomplete from a blob
  // worker. Without them the browser blocks it and the search silently returns nothing — the same
  // symptom as a bad key, from a completely different cause. The admin already allowed both.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://static.cloudflareinsights.com https://checkout.razorpay.com https://maps.googleapis.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.plantathome.in https://staging-api.plantathome.in https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.cloudflareinsights.com https://api.razorpay.com https://lumberjack.razorpay.com https://maps.googleapis.com https://maps.gstatic.com" +
    AGENTATION_CONNECT,
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://api.razorpay.com https://checkout.razorpay.com",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(self "https://checkout.razorpay.com"), geolocation=(self)' },
  // Short max-age to start, and deliberately NO preload: HSTS preload is effectively
  // irreversible, so it should be a decision taken on purpose rather than inherited from a
  // security sweep. Raise to 63072000 + preload once this has run clean for a while.
  { key: 'Strict-Transport-Security', value: 'max-age=86400; includeSubDomains' },
];

const COMPAT_ALIASES = {
  'react-query': './src/compat/react-query.tsx',
  'react-query/hydration': './src/compat/react-query-hydration.tsx',
  'next-i18next': './src/compat/next-i18next.tsx',
  'react-i18next': './src/compat/next-i18next.tsx',
  'next-seo': './src/compat/next-seo.tsx',
  'next/router': './src/compat/next-router.ts',
  'next-auth/react': './src/compat/next-auth-react.tsx',
};

const nextConfig: NextConfig = {
  // OFF deliberately (dev-only switch; production never mounts StrictMode).
  // With it ON, `next dev` intermittently livelocks on data-rich pages
  // (~80% of loads): React 19's dev double-render widens a hydration race
  // where a pending inlined-Flight/lazy chunk is retried in sync microtask
  // renders that starve the very <script> task that would resolve it —
  // proven via CDP pause-on-exceptions (ReactPromise from readChunk in
  // resolveLazy) and 6/6-healthy vs 5/6-frozen A/B probes on this exact
  // config flag. Real app-level loop causes (v5 tracked-result spread,
  // render-phase cookie writes, always-rendered next/dynamic) are all fixed;
  // this residual race is framework-level under the ported V1 tree.
  reactStrictMode: false,
  // Same-origin API proxy (mirrors V1's Vercel rewrite): the browser calls
  // /rest-api on this host; Next proxies to the legacy marvel API. SSR calls
  // the API directly via NEXT_PUBLIC_REST_API_ENDPOINT.
  async rewrites() {
    const target =
      process.env.NEXT_PUBLIC_REST_API_ENDPOINT ||
      'https://plantathome-production.up.railway.app/api';
    return [{ source: '/rest-api/:path*', destination: `${target}/:path*` }];
  },
  async redirects() {
    return [
      { source: '/shops', destination: '/', permanent: true },
      { source: '/shops/:path*', destination: '/', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'plantathome-media-prod.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'plantathome.s3.ap-south-1.amazonaws.com' },
      { protocol: 'https', hostname: 'pickbazarlaravel.s3.ap-southeast-1.amazonaws.com' },
      { protocol: 'https', hostname: 'pixarlaravel.s3.ap-southeast-1.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 's3.amazonaws.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plantathome-production.up.railway.app' },
      { protocol: 'https', hostname: 'api.plantathome.in' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [120, 160, 200, 256, 320, 384],
    minimumCacheTTL: 2592000,
  },
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['framer-motion', 'lodash', '@headlessui/react'],
  },
  turbopack: {
    resolveAlias: COMPAT_ALIASES,
  },
  async headers() {
    return [
      {
        source: '/:dir(images|brand|fonts|icons)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // The site had NO security headers at all. Applied to everything.
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
