import type Cookies from 'js-cookie';

/**
 * Attributes for cookies that carry the session.
 *
 * These were being written with `js-cookie` defaults — no `secure`, no `sameSite` — which
 * meant the auth cookie could ride an http:// request and was sent on cross-site navigations.
 *
 * Be clear about the ceiling: `httpOnly` is NOT achievable here and its absence is not an
 * oversight. The token is read back by JS and sent as an `Authorization: Bearer` header
 * (see framework/rest/client/http-client.ts), so a cookie the script cannot read would break
 * authentication entirely. Closing XSS token theft means moving auth server-side (a BFF that
 * holds the session and proxies), which is a rewrite, not a flag. Until then the CSP in
 * next.config.ts is the control that actually limits XSS — this hardens transport and
 * cross-site behaviour only.
 *
 * `sameSite: 'lax'` deliberately, not 'strict': the return navigation from the Razorpay
 * checkout is a cross-site POST-then-redirect back into the app, and 'strict' would drop the
 * cookie on arrival and log the customer out mid-payment.
 *
 * `secure` is gated on production so http://localhost development still works.
 */
export const AUTH_COOKIE_OPTIONS: Cookies.CookieAttributes = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};
