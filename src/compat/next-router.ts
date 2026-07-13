'use client';

/**
 * next/router → next/navigation compat shim.
 *
 * 130 V1 files import from '@/compat/next-router'; the tsconfig/turbopack aliases point
 * them here. Covers the patterns V1 actually uses:
 *  - useRouter().query        (route params ∪ search params)
 *  - .locale / .pathname / .asPath
 *  - .push / .replace / .back / .reload / .prefetch
 *  - .events.on/off           (no-op; tracking-bridge was rewritten to usePathname)
 *  - module-scope `Router` default export (http-client interceptor).
 *
 * IMPORTANT: search params are read from window.location via useSyncExternalStore
 * — NOT next/navigation's useSearchParams() — because that hook forces a CSR
 * bailout (Suspense) for every static/ISR page when called inside the provider
 * tree, which would kill the SSR/ISR rebuild wins. Server snapshot = empty
 * query, exactly matching pages-router behavior (query is {} until hydration /
 * isReady). Client updates come from popstate + patched history methods.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { useRouter as useNavRouter, usePathname, useParams } from 'next/navigation';

const NOOP_EVENTS = {
  on: (_e: string, _cb: (...a: any[]) => void) => {},
  off: (_e: string, _cb: (...a: any[]) => void) => {},
  emit: (_e: string, ..._a: any[]) => {},
};

/* ── reactive window.location.search (no Suspense requirement) ────────────── */
const LOCATION_EVENT = 'pah-locationchange';
let historyPatched = false;
function patchHistoryOnce() {
  if (historyPatched || typeof window === 'undefined') return;
  historyPatched = true;
  for (const method of ['pushState', 'replaceState'] as const) {
    const orig = window.history[method].bind(window.history);
    window.history[method] = ((...args: any[]) => {
      const r = (orig as any)(...args);
      window.dispatchEvent(new Event(LOCATION_EVENT));
      return r;
    }) as any;
  }
}

function subscribeToLocation(cb: () => void) {
  patchHistoryOnce();
  window.addEventListener('popstate', cb);
  window.addEventListener(LOCATION_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(LOCATION_EVENT, cb);
  };
}
const getSearchSnapshot = () => window.location.search;
const getServerSearchSnapshot = () => '';

export function useRouter() {
  const nav = useNavRouter();
  const pathname = usePathname() ?? '/';
  const params = useParams() ?? {};
  const search = useSyncExternalStore(subscribeToLocation, getSearchSnapshot, getServerSearchSnapshot);

  // useParams() may return a fresh object every render — key the memo on its
  // serialized VALUE so `query` identity is stable (V1 components put `query`
  // in effect deps; unstable identity = infinite effect loops).
  const paramsKey = JSON.stringify(params);
  const query = useMemo(() => {
    const q: Record<string, string | string[]> = {};
    if (search) {
      const sp = new URLSearchParams(search);
      sp.forEach((value, key) => {
        const existing = q[key];
        if (existing === undefined) q[key] = value;
        else q[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      });
    }
    for (const [k, v] of Object.entries(JSON.parse(paramsKey))) q[k] = v as string | string[];
    return q;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, paramsKey]);

  return useMemo(
    () => ({
      query,
      locale: 'en',
      locales: ['en'],
      defaultLocale: 'en',
      pathname,
      route: pathname,
      asPath: pathname + search,
      isReady: true,
      push: (url: any, _as?: any, _opts?: any) => Promise.resolve(nav.push(toUrl(url))),
      replace: (url: any, _as?: any, _opts?: any) => Promise.resolve(nav.replace(toUrl(url))),
      back: () => nav.back(),
      reload: () => window.location.reload(),
      prefetch: (url: string) => Promise.resolve(nav.prefetch(url)),
      events: NOOP_EVENTS,
    }),
    [query, pathname, search, nav],
  );
}

/** Serialize v3-style UrlObject pushes ({pathname, query}) to a string URL. */
function toUrl(url: string | { pathname?: string; query?: Record<string, any> }): string {
  if (typeof url === 'string') return url;
  const qs = url.query
    ? new URLSearchParams(
        Object.entries(url.query).map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  return `${url.pathname ?? '/'}${qs ? `?${qs}` : ''}`;
}

/** Module-scope singleton (V1: `import Router from '@/compat/next-router'`). */
const Router = {
  locale: 'en' as string | undefined,
  events: NOOP_EVENTS,
  get pathname() {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  },
  get asPath() {
    return typeof window !== 'undefined'
      ? window.location.pathname + window.location.search + window.location.hash
      : '/';
  },
  push(url: string | { pathname?: string; query?: Record<string, any> }) {
    if (typeof window !== 'undefined') window.location.assign(toUrl(url));
    return Promise.resolve(true);
  },
  replace(url: string | { pathname?: string; query?: Record<string, any> }) {
    if (typeof window !== 'undefined') window.location.replace(toUrl(url));
    return Promise.resolve(true);
  },
  reload() {
    if (typeof window !== 'undefined') window.location.reload();
  },
  back() {
    if (typeof window !== 'undefined') window.history.back();
  },
};

export default Router;
