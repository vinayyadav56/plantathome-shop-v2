/**
 * Google sign-in for the storefront, without next-auth.
 *
 * next-auth v4 is incompatible with Next 16 / React 19, which is why the old
 * `signIn('google')` was a no-op stub that rendered a button and did nothing.
 *
 * Flow: Google Identity Services token client → OAuth access token in the
 * browser → POST /social-login-token. The API verifies the token with Google
 * and issues our own auth token, exactly as it already does for the native app.
 *
 * Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID at build time (the SAME web client the
 * API trusts) and the site origin listed under that client's "Authorized
 * JavaScript origins" in Google Cloud Console.
 */
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPE = 'openid email profile';

type TokenResponse = { access_token?: string; error?: string; error_description?: string };
type ErrorEvent = { type?: string; message?: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { google?: any }
}

export class GoogleSignInError extends Error {}

let loading: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new GoogleSignInError('no window'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new GoogleSignInError('Google sign-in could not load. Check your connection and try again.'));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Resolves an OAuth access token, or null when the shopper closed the popup. */
export async function requestGoogleAccessToken(): Promise<string | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new GoogleSignInError('Google sign-in is not configured for this site yet.');
  }
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (r: TokenResponse) => {
        if (r?.access_token) return resolve(r.access_token);
        if (r?.error === 'access_denied') return resolve(null);
        reject(new GoogleSignInError(r?.error_description || r?.error || 'Google sign-in failed.'));
      },
      error_callback: (e: ErrorEvent) => {
        if (e?.type === 'popup_closed') return resolve(null);
        reject(new GoogleSignInError(e?.message || e?.type || 'Google sign-in failed.'));
      },
    });
    client.requestAccessToken();
  });
}
