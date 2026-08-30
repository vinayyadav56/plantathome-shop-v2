'use client';

import { useMemo } from 'react';
import Seo from '@/components/seo/seo';
import PageBanner from '@/components/banners/page-banner';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';
import { sanitizeContent } from '@/lib/sanitize-content';

export type PublicPolicy = {
  slug: string;
  title: string;
  document_code?: string;
  version?: string;
  effective_date?: string | null;
  updated_at?: string | null;
  content_html?: string | null;
  toc?: { level: number; text: string; id: string }[];
};

/**
 * Public governed policy page (/policies/[slug]). Content comes from the Legal
 * module's published documents — only PUBLISHED + visibility=public documents
 * are reachable, enforced server-side.
 *
 * Heading ids are injected client-side from the same slug rule the API used to
 * build the table of contents, so anchors line up without the API having to
 * rewrite stored HTML.
 */
export default function PolicyPage({ policy }: { policy: PublicPolicy }) {
  const html = useMemo(() => {
    const clean = sanitizeContent(policy.content_html ?? '');
    let i = 0;
    const ids = policy.toc ?? [];
    return clean.replace(/<h([23])(\s[^>]*)?>/gi, (match, level, attrs) => {
      const id = ids[i]?.id;
      i += 1;
      return id ? `<h${level}${attrs ?? ''} id="${id}">` : match;
    });
  }, [policy.content_html, policy.toc]);

  const toc = policy.toc ?? [];

  return (
    <>
      <Seo title={policy.title} url={`policies/${policy.slug}`} />
      <PageBanner title={policy.title} breadcrumbTitle="Home" />
      <section className="mx-auto w-full max-w-7xl g-light-a px-5 py-8 lg:px-8 lg:py-10 xl:px-16 xl:py-14">
        <p className="mb-8 text-sm text-body-dark md:text-base">
          {policy.effective_date && <>Effective {policy.effective_date}. </>}
          {policy.updated_at && <>Last updated {policy.updated_at}.</>}
          {policy.version && <span className="text-stone-500"> · Version {policy.version}</span>}
        </p>

        <div className="flex flex-col gap-8 md:flex-row">
          {toc.length > 2 && (
            <nav className="md:w-64 md:shrink-0" aria-label="On this page">
              <ol className="sticky top-24 space-y-1 border-s border-stone-200 ps-4 text-sm">
                {toc.map((h) => (
                  <li key={h.id} className={h.level === 3 ? 'ps-3' : ''}>
                    <a href={`#${h.id}`} className="block py-1 text-stone-600 transition hover:text-forest-900">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div
            className="react-editor-description min-w-0 flex-1 leading-loose text-body-dark [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:font-cormorant [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-forest-900 [&_h2]:md:text-2xl [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-forest-900 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_p]:mb-4 [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-stone-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-stone-200 [&_th]:bg-stone-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-start [&_blockquote]:my-4 [&_blockquote]:border-s-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_a]:text-forest-700 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </section>
    </>
  );
}

/* ── App Router body wrapper ──────────────────────────────────────────
   The layout helper pulls in client-only modules (contexts, effects), so
   it must be applied INSIDE this 'use client' boundary — a server page
   importing it directly fails the Turbopack build even though tsc is
   happy. Every other page-body in this repo wraps the same way. */

export function PageBody({ policy }: { policy: PublicPolicy }) {
  return getLayoutWithFooter(<PolicyPage policy={policy} />);
}
