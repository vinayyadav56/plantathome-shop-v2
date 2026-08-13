'use client';

import { useRouter } from '@/compat/next-router';
import Link from 'next/link';
import { useAtom } from 'jotai';
import StickyBox from 'react-sticky-box';
import { getLayout as getSiteLayout } from '@/components/layouts/layout';
import Seo from '@/components/seo/seo';
import { Image } from '@/components/ui/image';
import { Grid } from '@/components/products/grid';
import SidebarFilter from '@/components/search-view/sidebar-filter';
import ListingToolbar, { useListingView } from '@/components/search-view/listing-toolbar';
import { FilterIcon } from '@/components/icons/filter-icon';
import ErrorMessage from '@/components/ui/error-message';
import { useCategory } from '@/framework/category';
import { useProducts } from '@/framework/product';
import { PRODUCTS_PER_PAGE } from '@/framework/client/variables';
import { useHomeConfig } from '@/lib/use-home-config';
import { productPlaceholder } from '@/lib/placeholders';
import { drawerAtom } from '@/store/drawer-atom';
import type { Product } from '@/types';
import { ArrowLeft } from '@/components/ui/icon';


export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}

const GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function CategoryPage() {
  const { query } = useRouter();
  const { slug: slugParam, ...restQuery } = (query ?? {}) as any;
  const slug = slugParam as string;
  const [, setDrawerView] = useAtom(drawerAtom);
  const [view, setView] = useListingView();

  const { category, isLoading: loadingCategory, error } = useCategory({ slug });
  const { homeCollections } = useHomeConfig();

  const typeSlug = (category?.type as any)?.slug;
  const typeName = (category?.type as any)?.name;
  const {
    products,
    isLoading,
    loadMore,
    isLoadingMore,
    hasMore,
    error: productsError,
  } = useProducts({
    limit: PRODUCTS_PER_PAGE,
    orderBy: 'created_at',
    sortedBy: 'DESC',
    // Sidebar filters (price/tags/sort…) flow through the URL query, exactly
    // like the search page — but the category itself is pinned by the route.
    ...restQuery,
    categories: slug,
    ...(typeSlug && { type: typeSlug }),
  });

  if (error) return <ErrorMessage message={error.message} />;

  // Hero image resolves through the SAME chain as the homepage collection
  // tiles (admin CMS card image → category.image), so the two always match;
  // the wide banner_image stays as an extra fallback.
  const cmsCard = homeCollections?.cards?.find((c: any) => c.categorySlug === slug);
  const cmsImage =
    typeof (cmsCard as any)?.image === 'string'
      ? (cmsCard as any).image
      : (cmsCard as any)?.image?.original;
  const banner =
    cmsImage ||
    category?.image?.original ||
    category?.image?.thumbnail ||
    category?.banner_image?.original ||
    category?.banner_image?.thumbnail ||
    productPlaceholder;

  const children = category?.children ?? [];
  const productCount = (products ?? []).length;

  return (
    <div className="bg-cream-100">
      <Seo
        title={category?.name ? `${category.name} — PlantAtHome` : 'Category — PlantAtHome'}
        description={category?.details || category?.description || `Shop ${category?.name ?? 'our'} collection at PlantAtHome.`}
        url={`c/${slug}`}
      />

      {/* ── BANNER ── */}
      <section className="relative isolate overflow-hidden">
        {/* background image */}
        <Image
          src={banner ?? productPlaceholder}
          alt={category?.name ?? 'Category'}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        {/* layered gradient scrim — rich bottom-up, forest-900 based */}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(22,48,26,0.94)_0%,rgba(22,48,26,0.55)_45%,rgba(22,48,26,0.18)_100%)]" />
        {/* grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px' }}
        />
        {/* warm gold glow — bottom-left, matches home accent */}
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-[320px] w-[320px] rounded-full bg-[radial-gradient(ellipse,rgba(181,142,57,0.14)_0%,transparent_65%)]" />

        <div className="relative mx-auto flex min-h-[220px] max-w-7xl flex-col justify-end px-5 py-8 sm:min-h-[280px] sm:px-8 lg:min-h-[340px] lg:px-16 lg:py-11">

          {/* breadcrumb */}
          {typeSlug && (
            <Link
              href={`/${typeSlug}/search`}
              className="mb-5 inline-flex w-max items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 font-hanken text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md transition hover:text-white"
            >
              <ArrowLeft size={12} aria-hidden />
              {typeName ?? 'All products'}
            </Link>
          )}

          {/* eyebrow */}
          <div className="mb-3 inline-flex w-fit items-center gap-2.5 rounded-full border border-goldlight/25 bg-white/[0.07] px-3.5 py-1.5">
            <span className="relative flex h-[7px] w-[7px] shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-gold" />
            </span>
            <span className="font-hanken text-[10px] font-bold uppercase tracking-[0.2em] text-goldlight">
              Collection
            </span>
          </div>

          {/* H1 */}
          <h1 className="font-pahserif text-[2.6rem] font-medium leading-tight tracking-[-0.015em] text-white sm:text-[3.4rem] lg:text-[4rem]">
            {category?.name ?? (loadingCategory ? 'Loading…' : 'Category')}
          </h1>

          {/* description */}
          {(category?.details || category?.description) && (
            <p className="mt-4 max-w-2xl font-hanken text-[14px] leading-[1.6] text-white/[0.78] sm:text-[15.5px]">
              {category?.details || category?.description}
            </p>
          )}
        </div>
      </section>

      {/* ── SUB-CATEGORY PILLS ── */}
      {children.length > 0 && (
        <section className="border-b border-kraft-200 bg-white px-5 py-5 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap gap-2.5">
              {children.map((child) => (
                <Link
                  key={child.id ?? child.slug}
                  href={`/c/${child.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-kraft-200 bg-white px-4 py-2 font-hanken text-[12.5px] font-medium text-forest-800 shadow-[0_1px_4px_rgba(34,48,26,0.07)] transition duration-200 hover:border-forest-400 hover:bg-forest-50 hover:text-forest-700"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRODUCTS ── */}
      {/* Full-bleed listing (matches /search): no max-width cap, slim gutters */}
      <section className="min-h-[40vh] border-t border-kraft-200 px-4 py-10 sm:px-5 lg:px-6 xl:px-8 xl:py-14">
        {/* section header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="font-hanken text-[10.5px] font-bold uppercase tracking-[0.2em] text-gold">
              {category?.name ?? 'Products'}
            </p>
            <h2 className="mt-1.5 font-pahserif text-[2rem] font-medium leading-none tracking-[-0.01em] text-forest-900 sm:text-[2.6rem]">
              Shop the collection.
            </h2>
          </div>
        </div>

        {/* filter rail + grid — the same layout and card density as the
            search page, so the two listing surfaces feel identical */}
        <div className="flex w-full md:gap-6 lg:gap-10">
          <div className="hidden w-72 shrink-0 md:block lg:w-80">
            <StickyBox offsetTop={140} offsetBottom={30}>
              {/* showSort={false}: sorting lives in the toolbar above the grid
                  now, where shoppers expect it. Two sort controls on one page
                  that write the same URL params is a way to confuse people. */}
              <SidebarFilter inRail showCategories={false} showSort={false} type={typeSlug} />
            </StickyBox>
          </div>
          <div className="min-w-0 flex-1">
            <ListingToolbar
              view={view}
              onViewChange={setView}
              count={productCount}
              hasMore={hasMore}
            />
            <Grid
              products={products as Product[] | undefined}
              loadMore={loadMore}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              error={productsError}
              column={view === 'list' ? 'list' : 'five'}
              categoryName={category?.name}
            />
          </div>
        </div>

        {/* Floating filter button (sub-md) — same drawer as the search page */}
        <button
          type="button"
          onClick={() => setDrawerView({ display: true, view: 'SEARCH_FILTER' })}
          className="fixed bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ds-btn text-white shadow-lg ltr:right-4 rtl:left-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
        >
          <span className="sr-only">Filters</span>
          <FilterIcon width="17.05" height="18" />
        </button>
      </section>
    </div>
  );
}

CategoryPage.getLayout = getSiteLayout;


/* ── App Router body wrapper (added by port; V1 _app.tsx getLayout semantics) ── */

export function PageBody(props: any) {
  const page = <CategoryPage {...props} />;
  const withLayout = (CategoryPage as any).getLayout ? (CategoryPage as any).getLayout(page) : page;
  return withLayout;
}
