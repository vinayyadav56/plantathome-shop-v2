import { useSettings } from '@/framework/settings';
import { DefaultSeo as NextDefaultSeo } from 'next-seo';
import { useRouter } from '@/compat/next-router';

const OG_LOCALE: Record<string, string> = {
  en: 'en_IN', hi: 'hi_IN', ta: 'ta_IN', te: 'te_IN', mr: 'mr_IN',
  kn: 'kn_IN', bn: 'bn_IN', gu: 'gu_IN', ml: 'ml_IN', pa: 'pa_IN',
};

const DefaultSeo = () => {
  const { settings } : any = useSettings();
  const { locale } = useRouter();

  // Admin-managed favicon (Tools → Logo & Branding). When set, it becomes the
  // browser-tab / search icon site-wide with no redeploy; otherwise the built-in
  // PlantAtHome icon files are used.
  const favicon: string | undefined = settings?.favicon?.original;
  const faviconType = favicon
    ? /\.svg(\?|$)/i.test(favicon)
      ? 'image/svg+xml'
      : /\.png(\?|$)/i.test(favicon)
      ? 'image/png'
      : 'image/x-icon'
    : undefined;

  const iconTags = favicon
    ? [
        { rel: 'icon', type: faviconType, href: favicon },
        { rel: 'apple-touch-icon', href: favicon },
      ]
    : [
        // Built-in PlantAtHome favicon (absolute paths so they resolve on deep routes).
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icons/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/manifest-icon-192.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-icon-180.png' },
      ];

  return (
    <NextDefaultSeo
      additionalMetaTags={[
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1 maximum-scale=1',
        },
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes',
        },
        {
          name: 'theme-color',
          content: '#0D3B2E',
        },
      ]}
      additionalLinkTags={[
        ...iconTags,
        {
          rel: 'manifest',
          href: '/manifest.json',
        },
      ]}
      title={settings?.seo?.metaTitle}
      titleTemplate={`${
        settings?.seo?.metaTitle || settings?.siteTitle || 'E-Commerce'
      } | %s`}
      defaultTitle="PlantAtHome"
      description={settings?.seo?.metaDescription || settings?.siteSubtitle}
      canonical={settings?.seo?.canonicalUrl}
      openGraph={{
        title: settings?.seo?.ogTitle,
        description: settings?.seo?.ogDescription,
        type: 'website',
        locale: OG_LOCALE[locale ?? 'en'] ?? 'en_IN',
        site_name: settings?.siteTitle,
        images: [
          {
            url: settings?.seo?.ogImage?.original,
            width: 800,
            height: 600,
            alt: settings?.seo?.ogTitle,
          },
        ],
      }}
      twitter={{
        handle: settings?.seo?.twitterHandle,
        site: settings?.siteTitle,
        cardType: settings?.seo?.twitterCardType,
      }}
    />
  );
};

export default DefaultSeo;
