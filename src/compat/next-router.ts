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

/* ── reactive window.location.search (no Suspense requirement) ──────────────
 *
 * We intentionally DO NOT patch window.history.pushState/replaceState: Next.js
 * App Router calls replaceState internally during hydration + scroll handling,
 * and patching it to notify useSyncExternalStore subscribers created a feedback
 * loop (notify → re-render → Next replaceState → notify …) that froze data-rich
 * pages (home). Instead subscribers listen to `popstate` (browser back/forward)
 * + a custom event that ONLY this shim's own push/replace dispatch — so search
 * updates on programmatic navigation without racing Next's internal history. */
const LOCATION_EVENT = 'pah-router-nav';

function notifyNav() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOCATION_EVENT));
}

function subscribeToLocation(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(LOCATION_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(LOCATION_EVENT, cb);
  };
}
const getSearchSnapshot = () => window.location.search;
const getServerSearchSnapshot = () => '';

/* ── shallow (client-only) URL updates for same-path query changes ───────────
 *
 * A push/replace that only changes the query string on the CURRENT path needs
 * no server round-trip: no page in this app reads search params on the server
 * (getServerSearchSnapshot === '' — `query` is {} until hydration), so all
 * filter-dependent data is fetched client-side by React Query keyed off the
 * reactive `query`. We change the URL via the History API — App Router treats
 * pushState/replaceState as a shallow URL update, NOT a navigation — then fire
 * our own event so useSyncExternalStore re-reads window.location.search and the
 * dependent queries re-run. This turns every filter / sort / chip click on the
 * search page from a full `force-dynamic` server render into an instant client
 * refetch (the products query already uses keepPreviousData, so the grid stays
 * put and just dims). An explicit `{ shallow: true }` opt forces it too. */
function pathOf(href: string): string {
  return href.split('#')[0].split('?')[0];
}
function canShallowNavigate(href: string, currentPath: string, opts?: any): boolean {
  if (typeof window === 'undefined') return false;
  if (opts && opts.shallow) return true;
  return pathOf(href) === currentPath;
}
function shallowNavigate(href: string, replace: boolean): void {
  // Call History directly — never PATCH it: patching pushState to notify created
  // a re-render → replaceState → notify loop that froze data-rich pages. One
  // call, then one notify: no recursion.
  if (replace) window.history.replaceState(null, '', href);
  else window.history.pushState(null, '', href);
  notifyNav();
}

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
      push: (url: any, _as?: any, opts?: any) => {
        const href = toUrl(url);
        if (canShallowNavigate(href, pathname, opts)) {
          shallowNavigate(href, false);
          return Promise.resolve(true);
        }
        nav.push(href);
        // let App Router update the URL, then re-read search
        setTimeout(notifyNav, 0);
        return Promise.resolve(true);
      },
      replace: (url: any, _as?: any, opts?: any) => {
        const href = toUrl(url);
        if (canShallowNavigate(href, pathname, opts)) {
          shallowNavigate(href, true);
          return Promise.resolve(true);
        }
        nav.replace(href);
        setTimeout(notifyNav, 0);
        return Promise.resolve(true);
      },
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
