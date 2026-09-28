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

/**
 * Mask anything that looks like a secret or a person before it leaves the browser: emails,
 * phone numbers, bearer/API tokens, Google keys. Error messages and stacks routinely embed user
 * input and request URLs, and a crash report must not become a PII sink.
 */
function scrub(s: string): string {
  return s
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/(?:\+?91[\s-]?)?\b[6-9]\d{9}\b/g, '[phone]')
    .replace(/\bAIza[0-9A-Za-z_-]{20,}/g, '[gkey]')
    .replace(/\b(bearer|token|authkey|api[_-]?key|password|otp)=?[\s:]*[A-Za-z0-9._~+/=-]{8,}/gi, '$1=[redacted]');
}

/** The page's path only. The query and hash can carry reset tokens, OAuth params and redirects. */
function safeUrl(): string {
  try {
    return `${window.location.origin}${window.location.pathname}`.slice(0, 300);
  } catch {
    return '';
  }
}

/**
 * The persisted checkout/cart state is what every prior instance of this crash hinged on — but it
 * holds the shopper's phone, name and street address. Keep the STRUCTURE the debugging needs
 * (which fields exist, ids, quantities, the verify response shape) and drop the identity.
 */
function debugShape(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    const v = JSON.parse(raw);
    return redact(v, 0);
  } catch {
    return null;
  }
}
const DROP = new Set([
  'customer_contact', 'customer_name', 'recipient_name', 'recipient_phone', 'title',
  'street_address', 'street_address2', 'house_no', 'landmark', 'area', 'delivery_instructions',
  'name', 'slug', 'image', 'note', 'email', 'phone',
]);
function redact(v: unknown, depth: number): unknown {
  if (depth > 6) return '[deep]';
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => redact(x, depth + 1));
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      out[k] = DROP.has(k) ? (x == null || x === '' ? x : '[set]') : redact(x, depth + 1);
    }
    return out;
  }
  if (typeof v === 'string') return scrub(v).slice(0, 200);
  return v;
}

export function reportClientError(r: ClientErrorReport): void {
  try {
    if (typeof window === 'undefined' || sent >= MAX_PER_PAGE) return;
    sent += 1;
    const body = JSON.stringify({
      message: scrub(String(r.message ?? '')).slice(0, 1000),
      stack: scrub(String(r.stack ?? '')).slice(0, 6000),
      digest: r.digest ?? null,
      source: r.source,
      url: safeUrl(),
      user_agent: navigator.userAgent.slice(0, 300),
      checkout_state: JSON.stringify(debugShape('plantathome-checkout')).slice(0, 4000),
      cart_state: JSON.stringify(debugShape('plantathome-cart')).slice(0, 4000),
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
