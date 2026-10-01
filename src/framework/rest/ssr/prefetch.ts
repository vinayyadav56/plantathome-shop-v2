/**
 * App Router server loaders — rewrite of V1's pages-router *.ssr.ts files.
 *
 * CRITICAL: every prefetch below builds EXACTLY the query key the ported client
 * hooks build (language:'en' included; `city` deliberately absent — V1 SSR is
 * city-less and the client re-scopes after mount via pah-location-changed).
 * TanStack hashes object keys order-independently, so key spelling here only
 * needs the same fields, not the same order.
 */

// Server-side: use @tanstack/react-query directly — the compat module is a
// 'use client' boundary and its exports can't be invoked from server code.
import { QueryClient, dehydrate } from '@tanstack/react-query';
import client from '@/framework/client';
import { API_ENDPOINTS } from '@/framework/client/api-endpoints';
import {
  CATEGORIES_PER_PAGE,
  PRODUCTS_PER_PAGE,
  TYPES_PER_PAGE,
} from '@/framework/client/variables';
import { formatProductsArgs } from '@/framework/utils/format-products-args';

const LOCALE = 'en';

export type HomeLoad = {
  variables: {
    popularProducts: any;
    products: any;
    categories: any;
    bestSellingProducts: any;
    layoutSettings: any;
    types: { type: string };
  };
  layout: string;
  dehydratedState: any;
};

/** Mirrors V1 home-pages.ssr.ts getStaticProps. Returns null → notFound. */
export async function loadHomeData(vertical?: string): Promise<HomeLoad | null> {
  const queryClient = new QueryClient();
  let types: any[];
  try {
    await queryClient.prefetchQuery({
      queryKey: [API_ENDPOINTS.SETTINGS, { language: LOCALE }],
      queryFn: ({ queryKey }: any) => client.settings.all(queryKey[1]),
    });
    types = await queryClient.fetchQuery({
      queryKey: [API_ENDPOINTS.TYPES, { limit: TYPES_PER_PAGE, language: LOCALE }],
      queryFn: ({ queryKey }: any) => client.types.all(queryKey[1]),
    });
  } catch {
    // API temporarily unavailable — render the empty-state home; client retries.
    return {
      variables: {
        popularProducts: {},
        products: {},
        categories: {},
        bestSellingProducts: {},
        layoutSettings: {},
        types: { type: '' },
      },
      layout: 'default',
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    };
  }

  const pageType = vertical ?? (types.find((t: any) => t?.settings?.isHome)?.slug ?? types?.[0]?.slug);
  if (!types?.some((t: any) => t.slug === pageType)) return null;

  await queryClient.prefetchQuery({
    queryKey: [API_ENDPOINTS.TYPES, { slug: pageType, language: LOCALE }],
    queryFn: ({ queryKey }: any) => client.types.get(queryKey[1]),
  });

  const productVariables = { type: pageType, limit: PRODUCTS_PER_PAGE };
  // The hooks run their options through formatProductsArgs (adds hide_unpriced,
  // with:type;author, searchJoin …) before building the query key. The old prefetch
  // used the RAW options, so its key never matched useProducts' key and the homepage
  // painted empty, then refetched everything client-side through the slow path —
  // the "plant sections take ages" report. Build keys with the SAME formatter.
  const productsKey = (opts: any) => [
    API_ENDPOINTS.PRODUCTS,
    { ...formatProductsArgs(opts), language: LOCALE },
  ];
  const infinite = (queryKey: any[]) =>
    queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn: ({ queryKey }: any) => client.products.all(queryKey[1]),
      initialPageParam: undefined,
    } as any);
  const infiniteCategories = (variables: any) =>
    queryClient.prefetchInfiniteQuery({
      queryKey: [API_ENDPOINTS.CATEGORIES, { ...variables, language: LOCALE }],
      queryFn: ({ queryKey }: any) => client.categories.all(queryKey[1]),
      initialPageParam: undefined,
    } as any);
  await Promise.all([
    // home-screen's useProducts(variables.products)
    infinite(productsKey(productVariables)),
    // BestSellers' own tab query: useProducts({ type, limit: max(limit, 12) })
    infinite(productsKey({ type: pageType, limit: 12 })),
    // CategoryRow: useCategories({ limit: 100, parent: 'null', home: 1 })
    infiniteCategories({ limit: 100, parent: 'null', home: 1 }),
    // First VerticalSection (the home vertical): categories strip of that section
    infiniteCategories({ type: pageType, parent: 'null', limit: 12, home: 1 }),
  ]);

  const popularProductVariables = {
    type_slug: pageType,
    limit: 10,
    with: 'type;author',
    language: LOCALE,
  };

  const categoryVariables = {
    type: pageType,
    limit: CATEGORIES_PER_PAGE,
    language: LOCALE,
    parent: types.find((t: any) => t.slug === pageType)?.settings?.layoutType === 'minimal' ? 'all' : 'null',
  };
  await queryClient.prefetchInfiniteQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES, categoryVariables],
    queryFn: ({ queryKey }: any) => client.categories.all(queryKey[1]),
    initialPageParam: undefined,
  } as any);

  return {
    variables: {
      popularProducts: popularProductVariables,
      products: productVariables,
      categories: categoryVariables,
      bestSellingProducts: popularProductVariables,
      layoutSettings: { ...types.find((t: any) => t.slug === pageType)?.settings },
      types: { type: pageType },
    },
    layout: types.find((t: any) => t.slug === pageType)?.settings?.layoutType ?? 'default',
    dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
  };
}

/** Settings+types-only prefetch for general pages (mirrors general.ssr.ts). */
export async function loadGeneralData() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: [API_ENDPOINTS.SETTINGS, { language: LOCALE }],
      queryFn: ({ queryKey }: any) => client.settings.all(queryKey[1]),
    });
    await queryClient.prefetchQuery({
      queryKey: [API_ENDPOINTS.TYPES, { limit: TYPES_PER_PAGE, language: LOCALE }],
      queryFn: ({ queryKey }: any) => client.types.all(queryKey[1]),
    });
  } catch {
    /* fail-soft: client fetches on mount */
  }
  return { dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))) };
}

/** PDP loader (mirrors product.ssr.ts): settings prefetch + product by slug.
 *  Returns null → notFound. */
export async function loadProductData(slug: string) {
  const queryClient = new QueryClient();
  await queryClient
    .prefetchQuery({
      queryKey: [API_ENDPOINTS.SETTINGS, { language: LOCALE }],
      queryFn: ({ queryKey }: any) => client.settings.all(queryKey[1]),
    })
    .catch(() => {});
  try {
    const product = await client.products.get({ slug, language: LOCALE });
    return {
      product,
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    };
  } catch {
    return null;
  }
}

/** All type slugs for generateStaticParams (fail-soft → []). */
export async function loadTypeSlugs(): Promise<string[]> {
  try {
    const types = await client.types.all({ limit: 100 } as any);
    return (types ?? []).map((t: any) => t.slug);
  } catch {
    return [];
  }
}
