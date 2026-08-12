import { Routes } from '@/config/routes';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import type { SearchParamOptions } from '@/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import Router from '@/compat/next-router';

const Axios = axios.create({
  // SSR (no window): call Railway directly. Browser: call /rest-api on this domain,
  // which Vercel proxies to Railway — so users whose network can't reach railway.app
  // still work, and it's same-origin (no CORS).
  baseURL:
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_REST_API_ENDPOINT
      : '/rest-api',
  // 30s. This was 5,000,000 ms (~83 minutes) — a hung request pinned every loading state
  // (and the disabled Place Order button) for as long, with no error ever arriving.
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Change request data/error here
Axios.interceptors.request.use((config) => {
  const token = Cookies.get(AUTH_TOKEN_KEY);
  // Enterprise i18n: advertise the active locale so the API's ResolveLanguage
  // middleware localizes dynamic content. The app already passes `?language=`
  // explicitly (which wins), but Accept-Language makes every call locale-aware
  // (and covers any call site that doesn't pass the param).
  // BROWSER ONLY: the next/router singleton THROWS when read during SSR
  // ("No router instance found"), which used to 500 every getServerSideProps
  // page (all /orders/* routes). Server-side calls rely on ?language= instead.
  let locale: string | undefined;
  if (typeof window !== 'undefined') {
    try {
      locale = Router?.locale || Cookies.get('NEXT_LOCALE');
    } catch {
      locale = Cookies.get('NEXT_LOCALE');
    }
  }
  //@ts-ignore
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token ? token : ''}`,
    ...(locale ? { 'Accept-Language': locale } : {}),
  };
  return config;
});

// 401/403 handling. The previous version treated them identically: drop the
// token and SILENTLY Router.replace('/') — no message, no login prompt, and a
// mere 403 (authenticated but not allowed) destroyed the whole session. The
// admin panel had this exact bug and it made staff RBAC unusable there.
//
//  401 / NOT_AUTHORIZED, and a token existed → the session is dead. Clear it,
//    say so once, and send the user to sign-in so they can come straight back.
//    The `hadToken` guard matters: a guest (or a failed login POST) also gets
//    401s, and bouncing THEM to /signin would loop.
//  403 → the user is signed in but not allowed this one thing. Keep the
//    session, keep the page; the failing call's own error surface handles it.
let sessionExpiredNotified = false;
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // A 403 NEVER counts as session death, even when the body says
    // NOT_AUTHORIZED — the API uses that message on permission failures too,
    // and treating it as auth-expiry would reintroduce exactly the
    // 403-nukes-the-session bug this rework removes. The message check only
    // applies to non-403 responses (legacy endpoints that signal a dead token
    // without a clean 401).
    const isAuthError =
      status === 401 ||
      (status !== 403 &&
        error.response?.data?.message === 'PLANTATHOME_ERROR.NOT_AUTHORIZED');

    if (isAuthError) {
      const hadToken = Boolean(Cookies.get(AUTH_TOKEN_KEY));
      Cookies.remove(AUTH_TOKEN_KEY);
      if (hadToken && typeof window !== 'undefined') {
        if (!sessionExpiredNotified) {
          sessionExpiredNotified = true;
          // Lazy import keeps toastify out of the SSR path; reset the flag so
          // a later, separate expiry can notify again.
          import('react-toastify').then(({ toast }) => {
            toast.error('Your session has expired — please sign in again.');
            setTimeout(() => {
              sessionExpiredNotified = false;
            }, 5000);
          });
        }
        // Preserve where they were: a bare replace(login) dropped the
        // destination, so an expired session on /checkout landed you on the
        // homepage after signing back in.
        const from = Router.asPath;
        const redirect = from && !from.startsWith('/signin') ? from : undefined;
        Router.replace({
          pathname: Routes.login,
          ...(redirect ? { query: { redirect } } : {}),
        } as any);
      }
    }
    // 403: deliberately no logout and no navigation.
    return Promise.reject(error);
  }
);

export class HttpClient {
  static async get<T>(url: string, params?: unknown) {
    const response = await Axios.get<T>(url, { params });
    return response.data;
  }

  static async post<T>(url: string, data: unknown, options?: any) {
    const response = await Axios.post<T>(url, data, options);
    return response.data;
  }

  static async put<T>(url: string, data: unknown) {
    const response = await Axios.put<T>(url, data);
    return response.data;
  }

  static async delete<T>(url: string) {
    const response = await Axios.delete<T>(url);
    return response.data;
  }

  static formatSearchParams(params: Partial<SearchParamOptions>) {
    return Object.entries(params)
      .filter(([, value]) => Boolean(value))
      .map(([k, v]) =>
        ['type', 'categories', 'tags', 'author', 'manufacturer','shops'].includes(k)
          ? `${k}.slug:${v}`
          : `${k}:${v}`
      )
      .join(';');
  }
}
