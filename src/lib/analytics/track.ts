import Cookies from 'js-cookie';
import { getStoredCity } from '@/lib/customer-location';

/**
 * Storefront analytics tracker (Visitor / Live Activity NOC).
 *
 * RUTHLESSLY fail-safe: every path is wrapped so tracking can NEVER throw into
 * the storefront. Fire-and-forget (fetch keepalive, sendBeacon fallback) so it
 * never blocks rendering or navigation. Disable instantly with
 * NEXT_PUBLIC_TRACKING_ENABLED='false'.
 *
 * Identity
 *   pah_vid   cookie, 1 year — the VISITOR (one browser; clearing cookies, another
 *             browser/device or a private window is a new visitor; not a person)
 *   pah_sid   localStorage — the SESSION; rotates after 30 min without activity
 *             (must match config('tracking.session_timeout_min') on the API)
 *   pah_utm   localStorage — FIRST-touch utm_* (written once)
 *
 * Heartbeat: every HEARTBEAT_MS while the tab is visible, paused while hidden.
 * The API's "online" window is 120 s = four missed beats. A beat only touches
 * last_seen — it is not a page view and not an event.
 *
 * Non-JS crawlers never run this; proxy.ts covers them server-side.
 */

const ENABLED = process.env.NEXT_PUBLIC_TRACKING_ENABLED !== 'false';
const VID_COOKIE = 'pah_vid';
const SID_KEY = 'pah_sid';
const SID_AT_KEY = 'pah_sid_at';
const UTM_KEY = 'pah_utm';
const FLUSH_DELAY = 1200;
const HEARTBEAT_MS = 30_000;
const SESSION_TIMEOUT_MS = 30 * 60_000;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type EventInput = { url?: string; label?: string; value?: number; meta?: Record<string, unknown> };
type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

let queue: any[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let currentUserId: string | number | null = null;
let utmCaptured = false;

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
  } catch {
    /* noop */
  }
  return 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function visitorId(): string {
  try {
    let id = Cookies.get(VID_COOKIE);
    if (!id) {
      id = uuid();
      Cookies.set(VID_COOKIE, id, {
        expires: 365,
        sameSite: 'lax',
        secure: typeof location !== 'undefined' && location.protocol === 'https:',
      });
    }
    return id;
  } catch {
    return uuid();
  }
}

/** The current session id; a new one after 30 min of inactivity. Every call counts as activity. */
function sessionId(): string {
  try {
    const now = Date.now();
    let s = localStorage.getItem(SID_KEY);
    const at = Number(localStorage.getItem(SID_AT_KEY) ?? 0);
    if (!s || !at || now - at > SESSION_TIMEOUT_MS) {
      s = uuid();
      localStorage.setItem(SID_KEY, s);
    }
    localStorage.setItem(SID_AT_KEY, String(now));
    return s;
  } catch {
    return '';
  }
}

/** Path only — query strings carry reset tokens and search terms; the API strips again anyway. */
function cleanPath(url?: string): string {
  try {
    const raw = url ?? window.location.pathname;
    return raw.split('?')[0].split('#')[0] || '/';
  } catch {
    return '/';
  }
}

/** utm_* on the current URL (if any), captured once as first-touch; otherwise the stored first-touch. */
function utm(): Utm | undefined {
  try {
    const params = new URLSearchParams(window.location.search);
    const current: Utm = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) current[k] = v.slice(0, 120);
    }
    if (Object.keys(current).length) {
      if (!utmCaptured && !localStorage.getItem(UTM_KEY)) {
        localStorage.setItem(UTM_KEY, JSON.stringify(current));
      }
      utmCaptured = true;
      return current;
    }
    const stored = localStorage.getItem(UTM_KEY);
    return stored ? (JSON.parse(stored) as Utm) : undefined;
  } catch {
    return undefined;
  }
}

function endpoint(): string {
  // DIRECT to the API (like every other browser call): no Node proxy hop on the
  // storefront box, and the API sees Cloudflare's real-client headers for coarse
  // geo. A text/plain body with no credentials is a "simple" request — no
  // preflight — so the API's CORS '*' is enough.
  const base = process.env.NEXT_PUBLIC_REST_API_ENDPOINT;
  return base ? `${base.replace(/\/$/, '')}/track` : '/rest-api/track';
}

function send(payload: any): void {
  try {
    const body = JSON.stringify(payload);
    if (typeof fetch === 'function') {
      fetch(endpoint(), {
        method: 'POST',
        keepalive: true,
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain' },
        body,
      }).catch(() => {});
      return;
    }
    // Very old browsers: sendBeacon always carries cookies, so it must stay SAME-ORIGIN
    // (the Next rewrite) or the API's CORS '*' makes the browser log an error.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/rest-api/track', new Blob([body], { type: 'application/json' }));
    }
  } catch {
    /* tracking must never throw */
  }
}

function envelope(page?: string) {
  return {
    visitor_id: visitorId(),
    session_id: sessionId(),
    user_id: currentUserId,
    page: cleanPath(page),
    shopping_city: getStoredCity() ?? undefined,
  };
}

/** Attach the logged-in user id (advisory — analytics only). */
export function setTrackUser(id: string | number | null | undefined): void {
  currentUserId = id ?? null;
}

export function flush(page?: string): void {
  if (!ENABLED || typeof window === 'undefined' || !queue.length) return;
  try {
    const events = queue;
    queue = [];
    send({
      ...envelope(page),
      referrer: document.referrer || null,
      utm: utm(),
      events,
    });
  } catch {
    /* noop */
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_DELAY);
}

export function track(type: string, data: EventInput = {}): void {
  if (!ENABLED || typeof window === 'undefined') return;
  try {
    queue.push({
      type,
      url: cleanPath(data.url),
      label: data.label,
      value: data.value,
      meta: data.meta,
    });
    scheduleFlush();
  } catch {
    /* noop */
  }
}

/** Classify a path → page_view + the matching funnel step; flush promptly. */
export function trackPage(pathname: string): void {
  if (!ENABLED || typeof window === 'undefined') return;
  try {
    const path = cleanPath(pathname);
    track('page_view', { url: path });
    if (/^\/c\//.test(path)) {
      track('category_view', { url: path, label: path.split('/')[2] });
    } else if (/^\/cart\b/.test(path)) {
      track('view_cart', { url: path });
    } else if (/^\/checkout\b/.test(path)) {
      track('begin_checkout', { url: path });
    }
    // product_view is explicit (the PDP body sends product id + category);
    // order_created / order_success are explicit too — nothing navigates to a
    // thank-you page, which is why the old path rule never fired.
    flush(path);
    startHeartbeat();
  } catch {
    /* noop */
  }
}

// ── Heartbeat ────────────────────────────────────────────────────────────────

function beat(): void {
  if (!ENABLED || typeof document === 'undefined' || document.visibilityState !== 'visible') return;
  send({ ...envelope(), heartbeat: true, events: [] });
}

function startHeartbeat(): void {
  if (heartbeatTimer || typeof document === 'undefined' || document.visibilityState !== 'visible') return;
  heartbeatTimer = setInterval(beat, HEARTBEAT_MS);
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// Hidden tab: flush what is queued and stop beating. Visible again: one beat
// now (so "online" recovers immediately) and resume.
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('pagehide', () => {
      stopHeartbeat();
      flush();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        stopHeartbeat();
        flush();
      } else {
        beat();
        startHeartbeat();
      }
    });
  } catch {
    /* noop */
  }
}
