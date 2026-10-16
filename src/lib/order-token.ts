/**
 * Per-order access token (guest orders).
 *
 * The API mints a high-entropy `tracking_token` on every order and requires it to
 * view a GUEST order (one with no logged-in owner) — this closes the historical
 * IDOR where anyone could read a guest order by guessing its tracking number.
 *
 * We persist the token client-side, keyed by tracking number, so the order
 * confirmation, payment, and thank-you pages can all re-send it after the
 * post-checkout redirect (and across reloads). Registered users don't need it —
 * the API authorises them by ownership.
 */
const key = (trackingNumber: string) => `pah_order_token_${trackingNumber}`;

export function saveOrderToken(
  trackingNumber: string,
  token?: string | null,
): void {
  if (typeof window === 'undefined' || !trackingNumber || !token) return;
  try {
    window.localStorage.setItem(key(trackingNumber), token);
  } catch {
    // private mode / quota — non-fatal
  }
}

export function getOrderToken(trackingNumber: string): string | undefined {
  if (typeof window === 'undefined' || !trackingNumber) return undefined;
  try {
    return window.localStorage.getItem(key(trackingNumber)) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the token for a tracking number: prefer one supplied in the URL (the
 * emailed link or the post-checkout redirect both carry `?token=`), persisting it
 * so sub-pages can reuse it; otherwise fall back to whatever was stored at checkout.
 */
export function resolveOrderToken(
  trackingNumber: string,
  urlToken?: string | string[] | null,
): string | undefined {
  const fromUrl = Array.isArray(urlToken) ? urlToken[0] : urlToken ?? undefined;
  if (fromUrl) {
    saveOrderToken(trackingNumber, fromUrl);
    return fromUrl;
  }
  return getOrderToken(trackingNumber);
}

/**
 * The online-payment checkout still waiting on its payment. An order is placed only once it is
 * paid (owner rule, 2026-10-16), so until then the cart stays and this remembers the attempt: a
 * customer who comes back — a UPI app switch that reloaded the tab, a closed window — is asked about
 * it (pay on delivery instead?) rather than placing a second order and paying twice.
 */
const PENDING_ATTEMPT = 'pah_pending_payment_attempt';

export function savePendingAttempt(trackingNumber: string): void {
  if (typeof window === 'undefined' || !trackingNumber) return;
  try {
    window.localStorage.setItem(PENDING_ATTEMPT, trackingNumber);
  } catch {
    // private mode / quota — non-fatal
  }
}

export function getPendingAttempt(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem(PENDING_ATTEMPT) || undefined;
  } catch {
    return undefined;
  }
}

export function clearPendingAttempt(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PENDING_ATTEMPT);
  } catch {
    // non-fatal
  }
}
