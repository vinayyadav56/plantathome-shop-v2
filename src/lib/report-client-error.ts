/**
 * Ship a browser-side error to the API so it lands in the request-log viewer with a stack.
 *
 * Why this exists: the storefront had NO error reporting — no Sentry, no window.onerror, no log
 * endpoint. app/error.tsx only console.error'd, and global-error.tsx said "We've logged it" while
 * logging nothing. The checkout "Something went wrong" crash was therefore patched three times
 * (8c3d32b, 46665c6, payment-grid.tsx) from code-reading alone, never from a stack — and it came
 * back each time. The fourth time the shopper could not open DevTools, so there was nothing to go
 * on at all. One POST here turns that into a row in the API's exception log.
 *
 * Rules: never throw, never await in a way that delays the UI, never send more than a few per
 * page (a render loop must not become a request loop), and keepalive so a navigation right after
 * the crash does not drop it.
 */
const ENDPOINT = `${process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? ''}/client-errors`;
const MAX_PER_PAGE = 5;
let sent = 0;

export type ClientErrorReport = {
  message: string;
  stack?: string;
  digest?: string;
  /** Where it was caught: 'route-boundary' | 'global-boundary' | 'window' | 'unhandledrejection' */
  source: string;
};

export function reportClientError(r: ClientErrorReport): void {
  try {
    if (typeof window === 'undefined' || sent >= MAX_PER_PAGE) return;
    sent += 1;
    const body = JSON.stringify({
      message: String(r.message ?? '').slice(0, 1000),
      stack: String(r.stack ?? '').slice(0, 6000),
      digest: r.digest ?? null,
      source: r.source,
      url: window.location.href.slice(0, 500),
      user_agent: navigator.userAgent.slice(0, 300),
      // Enough to reproduce: the persisted checkout state is what every prior instance of this
      // crash hinged on, and it is exactly what a reporter cannot describe from memory.
      checkout_state: safeStorage('plantathome-checkout'),
      cart_state: safeStorage('plantathome-cart'),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* reporting must never be the thing that breaks */
  }
}

function safeStorage(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key);
    return v == null ? null : v.slice(0, 4000);
  } catch {
    return null;
  }
}

/** Install once from a client provider: window errors + unhandled rejections. */
export function installClientErrorReporting(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onError = (e: ErrorEvent) =>
    reportClientError({ message: e.message, stack: e.error?.stack, source: 'window' });
  const onRejection = (e: PromiseRejectionEvent) =>
    reportClientError({
      message: e.reason?.message ?? String(e.reason),
      stack: e.reason?.stack,
      source: 'unhandledrejection',
    });
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
