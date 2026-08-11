'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import Seo from '@/components/seo/seo';
import PageBanner from '@/components/banners/page-banner';
import { useTypes } from '@/framework/type';
import { useCategories } from '@/framework/category';
import { TYPES_PER_PAGE } from '@/framework/client/variables';
import { getVerticalMeta } from '@/components/storefront/verticals';
import type { Type } from '@/types';
import { Sprout, ArrowRight } from '@/components/ui/icon';


/** Compact brand category card — image + serif name, links to /c/[slug].
    Staging has a tail of dead image URLs, so broken loads fall back to the
    brand plant glyph instead of the browser's broken-image box. */
function CategoryCard({ category }: { category: any }) {
  const [imgError, setImgError] = React.useState(false);
  const img = category.image?.original ?? category.image?.thumbnail ?? '';
  return (
    <Link
      href={`/c/${category.slug}`}
      className="group overflow-hidden rounded-2xl border border-kraft-200 bg-white shadow-[0_2px_8px_rgba(34,48,26,0.06)] transition-all duration-300 hover:-translate-y-[3px] hover:border-forest-200 hover:shadow-[0_12px_28px_rgba(34,48,26,0.12)]"
    >
      <div className="h-[120px] overflow-hidden bg-sage-50 sm:h-[136px]">
        {img && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={category.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-forest-300">
            <Sprout size={32} aria-hidden />
          </div>
        )}
      </div>
      <div className="px-3.5 py-3">
        <p className="m-0 line-clamp-1 font-hanken text-[13.5px] font-bold text-forest-900 transition-colors group-hover:text-forest-700">
          {category.name}
        </p>
      </div>
    </Link>
  );
}

/** One vertical's block: serif heading + its real categories (or a coming-soon tile). */
function VerticalSection({ type }: { type: Type }) {
  const { t } = useTranslation('common');
  const meta = getVerticalMeta(type.slug, type.name);
  const { categories, isLoading, hasMore, isLoadingMore, loadMore, paginatorInfo } =
    useCategories({
      type: type.slug,
      parent: 'null',
      limit: 100,
    } as any);
  const list = categories ?? [];

  // This is THE index page — fetch every page so no collection is unreachable
  // (plants alone has 200+ root categories; the API caps each page at 100).
  React.useEffect(() => {
    if (hasMore && !isLoadingMore) loadMore();
  }, [hasMore, isLoadingMore, loadMore]);

  const total = (paginatorInfo as any)?.total ?? list.length;

  return (
    <section className="border-t border-kraft-200/60 py-9 first:border-t-0 lg:py-11">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="m-0 font-pahserif text-[24px] font-medium tracking-[-0.005em] text-forest-900 sm:text-[30px]">
            {type.name ?? meta.label}
          </h2>
          <p className="mt-1 font-hanken text-[13px] text-stone-500">
            {meta.tagline}
            {total > 0 && (
              <span className="ms-2 text-stone-400">
                · {total} {t('categories-count-label')}
              </span>
            )}
          </p>
        </div>
        <Link
          href={meta.shopPath ?? meta.path}
          className="inline-flex shrink-0 items-center gap-[6px] whitespace-nowrap font-hanken text-[13.5px] font-semibold text-forest-700"
        >
          {t('categories-explore-vertical')}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>

      {isLoading && list.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[168px] animate-pulse rounded-2xl bg-sage-100" />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((c: any) => (
            <CategoryCard key={c.id ?? c.slug} category={c} />
          ))}
        </div>
      ) : (
        /* vertical exists but has no categories yet — honest editorial teaser */
        <Link
          href={meta.shopPath ?? meta.path}
          className="group relative block h-[150px] overflow-hidden rounded-2xl border border-kraft-200 sm:h-[170px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.scenes[0]}
            alt={type.name ?? meta.label}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(5,16,8,0.82)_0%,rgba(5,16,8,0.45)_55%,rgba(5,16,8,0.15)_100%)]" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-8">
            <span className="mb-2 w-fit rounded-full bg-[#D4A44B] px-3 py-1 font-hanken text-[10px] font-bold uppercase tracking-[0.14em] text-[#231A05]">
              {meta.comingSoon ? t('text-coming-soon') : t('categories-explore-vertical')}
            </span>
            <p className="m-0 max-w-md font-hanken text-[14px] leading-snug text-white/85">
              {meta.blurb}
            </p>
          </div>
        </Link>
      )}
    </section>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation('common');
  // Same options as the SSR prefetch (general.ssr) so the dehydrated cache hits.
  const { types, isLoading } = useTypes({ limit: TYPES_PER_PAGE } as any);
  const list = types ?? [];

  return (
    <>
      <Seo
        title="All Categories — PlantAtHome"
        description="Browse every collection across plants, pots, seeds, fertilizers, garden tools and farm-fresh boxes."
        url="categories"
      />
      <PageBanner
        title={t('categories-page-title')}
        breadcrumbTitle={t('text-home')}
      />
      <div className="g-light-a">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-2 sm:px-8 lg:px-16">
          {isLoading && list.length === 0 ? (
            <div className="space-y-8 py-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[220px] animate-pulse rounded-2xl bg-sage-100" />
              ))}
            </div>
          ) : (
            list.map((ty: Type) => <VerticalSection key={ty.slug} type={ty} />)
          )}
        </div>
      </div>
    </>
  );
}

CategoriesPage.getLayout = getSiteLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <CategoriesPage {...props} />;
  const withLayout = (CategoriesPage as any).getLayout ? (CategoriesPage as any).getLayout(page) : page;
  return withLayout;
}
