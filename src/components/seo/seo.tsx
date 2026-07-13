import { NextSeo, NextSeoProps } from 'next-seo';
import { useRouter } from '@/compat/next-router';

interface SeoProps extends NextSeoProps {
  url?: string;
  images?: any[] | null;
}

// og:locale mapping (BCP-47-ish, India-targeted) — extend as languages are added.
const OG_LOCALE: Record<string, string> = {
  en: 'en_IN', hi: 'hi_IN', ta: 'ta_IN', te: 'te_IN', mr: 'mr_IN',
  kn: 'kn_IN', bn: 'bn_IN', gu: 'gu_IN', ml: 'ml_IN', pa: 'pa_IN',
};

const Seo = ({ title, description, images, url, ...props }: SeoProps) => {
  const { locale, locales, defaultLocale, asPath } = useRouter();
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const path = (url ? `/${url}` : (asPath || '/')).split('?')[0].split('#')[0];

  // Next i18n serves the default locale at the root (no prefix); others are /<loc>.
  const urlFor = (loc?: string) => {
    const prefix = loc && loc !== defaultLocale ? `/${loc}` : '';
    const p = path === '/' ? '' : path;
    return `${base}${prefix}${p}`;
  };

  const multilang = (locales?.length ?? 1) > 1;
  const languageAlternates = multilang
    ? [
        ...(locales || []).map((loc) => ({ hrefLang: loc, href: urlFor(loc) })),
        { hrefLang: 'x-default', href: urlFor(defaultLocale) },
      ]
    : undefined;

  return (
    <NextSeo
      title={title}
      description={description}
      canonical={urlFor(locale)}
      languageAlternates={languageAlternates}
      openGraph={{
        url: urlFor(locale),
        title,
        description,
        locale: OG_LOCALE[locale ?? 'en'] ?? 'en_IN',
        ...(Boolean(images) && {
          images: images?.map((item) => ({
            url: item?.image?.original,
            alt: item?.title,
          })),
        }),
      }}
      {...props}
    />
  );
};

export default Seo;
