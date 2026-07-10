import type { ApiEnvelope } from './types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'https://plantathome-production.up.railway.app/api/v1';

/** A typed application error carrying the envelope's machine `code`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* The auth layer (token-store) injects these so the client stays auth-agnostic. */
let getAccessToken: () => string | null = () => null;
let refreshHook: (() => Promise<void>) | null = null;
export function setAccessTokenAccessor(fn: () => string | null) {
  getAccessToken = fn;
}
export function setRefreshHook(fn: () => Promise<void>) {
  refreshHook = fn;
}

function buildInit(init: RequestInit): RequestInit {
  const token = getAccessToken();
  return {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  };
}

async function unwrap<T>(res: Response): Promise<{ data: T; meta: ApiEnvelope<T>['meta'] }> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || !body?.success) {
    const err = body?.errors?.[0];
    throw new ApiError(
      res.status,
      err?.code ?? 'HTTP_ERROR',
      err?.message ?? `Request failed (${res.status})`,
      err?.field,
    );
  }
  return { data: body.data, meta: body.meta ?? {} };
}

/** Core fetch: attaches Bearer, and on a 401 refreshes once (via the injected
 *  hook) then retries exactly once — no retry loop. */
export async function apiFetchWithMeta<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<{ data: T; meta: ApiEnvelope<T>['meta'] }> {
  const res = await fetch(API_BASE + path, buildInit(init));
  if (res.status === 401 && retry && refreshHook) {
    await refreshHook();
    return apiFetchWithMeta<T>(path, init, false);
  }
  return unwrap<T>(res);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await apiFetchWithMeta<T>(path, init)).data;
}

/* Verb helpers. */
export const get = <T>(p: string) => apiFetch<T>(p);
export const getWithMeta = <T>(p: string) => apiFetchWithMeta<T>(p);
export const post = <T>(p: string, body?: unknown, headers?: Record<string, string>) =>
  apiFetch<T>(p, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined, headers });
export const put = <T>(p: string, body?: unknown) =>
  apiFetch<T>(p, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined });
export const del = <T>(p: string) => apiFetch<T>(p, { method: 'DELETE' });
