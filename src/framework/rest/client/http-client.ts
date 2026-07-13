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
  timeout: 5000000,
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

// Change response data/error here
Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      (error.response && error.response.status === 401) ||
      (error.response && error.response.status === 403) ||
      (error.response &&
        error.response.data.message === 'PLANTATHOME_ERROR.NOT_AUTHORIZED')
    ) {
      Cookies.remove(AUTH_TOKEN_KEY);
      Router.replace(Routes.home);
    }
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
