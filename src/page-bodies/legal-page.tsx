'use client';

import Seo from '@/components/seo/seo';
import PageBanner from '@/components/banners/page-banner';
import { useSettings } from '@/framework/settings';
import { sanitizeContent } from '@/lib/sanitize-content';
import { LEGAL_DEFAULTS, type LegalDoc } from '@/framework/static/legal-content';

/**
 * Shared body for /privacy and /terms. Content comes from
 * settings.options.legalPages.{doc} (Admin → Settings → Storefront → Legal
 * Pages); a blank/unset admin body falls back to the built-in copy in
 * legal-content.ts, so the pages can never render empty. Both sources pass
 * through the shared sanitizer before injection.
 */
export default function LegalPage({ doc }: { doc: 'privacy' | 'terms' }) {
  const { settings } = useSettings();
  const saved = (settings as any)?.legalPages?.[doc] as Partial<LegalDoc> | undefined;
  const fallback = LEGAL_DEFAULTS[doc];

  const title = saved?.title?.trim() || fallback.title;
  const updatedAt = saved?.updatedAt?.trim() || fallback.updatedAt;
  const body = saved?.body?.trim() || fallback.body;
  // Synchronous sanitize (not the effect-based hook) so the content is in the
  // server-rendered HTML — a legal page shouldn't be blank until hydration.
  const html = sanitizeContent(body);

  return (
    <>
      <Seo title={title} url={doc} />
      <PageBanner title={title} breadcrumbTitle="Home" />
      <section className="mx-auto w-full max-w-screen-lg g-light-a px-5 py-8 lg:py-10 xl:py-14">
        <p className="mb-8 text-sm text-body-dark md:text-base">
          Last Updated: {updatedAt}
        </p>
        <div
          className="react-editor-description leading-loose text-body-dark [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:font-cormorant [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-forest-900 [&_h2]:md:text-2xl [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-forest-900 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_p]:mb-4"
          dangerouslySetInnerHTML={{ __html: html ?? '' }}
        />
      </section>
    </>
  );
}
