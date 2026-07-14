'use client';

/**
 * react-query v3 → TanStack Query v5 compatibility layer.
 *
 * V1 shop code (framework/rest hooks + ~30 leaf components) is written against
 * react-query v3's POSITIONAL signatures. This module is aliased in tsconfig
 * (`"react-query": ["./src/compat/react-query"]`) so those files port over
 * byte-identical while running on @tanstack/react-query v5 underneath.
 *
 * Translations handled here (the v3 semantics the app relies on):
 *  - useQuery(key, fn, opts)            → object form; `isLoading` = isPending
 *  - query-level onSuccess/onError      → replayed via useEffect on data/error
 *  - keepPreviousData: true             → placeholderData: keepPreviousData
 *  - useInfiniteQuery getNextPageParam returning `{page}` **or `false`**
 *                                       → false mapped to undefined; v5 needs
 *                                         initialPageParam (undefined, tolerated
 *                                         by V1's Object.assign spread)
 *  - useMutation(fn, opts)              → object form (+ isLoading alias)
 *  - queryClient.invalidateQueries('/x') / refetchQueries('/x') string keys
 *                                       → { queryKey: ['/x'] } via Proxy
 */

import * as React from 'react';
import {
  useQuery as useQueryV5,
  useInfiniteQuery as useInfiniteQueryV5,
  useMutation as useMutationV5,
  useQueryClient as useQueryClientV5,
  QueryClient as QueryClientV5,
  QueryClientProvider,
  HydrationBoundary,
  dehydrate,
  keepPreviousData as keepPreviousDataFn,
  useIsFetching as useIsFetchingV5,
  useIsMutating as useIsMutatingV5,
  type QueryKey,
} from '@tanstack/react-query';

export { QueryClientProvider };
export type { QueryKey };

const toArr = (key: any): readonly unknown[] => (Array.isArray(key) ? key : [key]);

/* ── useQuery ─────────────────────────────────────────────────────────────── */
type V3QueryOpts<TData, TError> = {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchInterval?: number | false;
  retry?: boolean | number;
  keepPreviousData?: boolean;
  initialData?: TData | (() => TData);
  select?: (data: any) => TData;
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: (data: TData | undefined, error: TError | null) => void;
  [k: string]: any;
};

export function useQuery<TData = unknown, TError = unknown>(
  key: any,
  fn: (ctx?: any) => Promise<TData> | TData,
  opts: V3QueryOpts<TData, TError> = {},
) {
  const { onSuccess, onError, onSettled, keepPreviousData, cacheTime, ...rest } = opts;
  const q = useQueryV5<any, TError, TData>({
    queryKey: toArr(key),
    queryFn: (ctx) => fn(ctx),
    ...(keepPreviousData ? { placeholderData: keepPreviousDataFn } : {}),
    ...(cacheTime !== undefined ? { gcTime: cacheTime } : {}),
    ...rest,
  });

  // v3 fired onSuccess/onError after fetch; replay as effects (only consumer
  // doing side effects is useUser — navigation/reload, effect-safe).
  const dataRef = React.useRef<any>(undefined);
  React.useEffect(() => {
    if (q.data !== undefined && q.data !== dataRef.current) {
      dataRef.current = q.data;
      onSuccess?.(q.data as TData);
      onSettled?.(q.data as TData, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);
  const errRef = React.useRef<any>(undefined);
  React.useEffect(() => {
    if (q.error && q.error !== errRef.current) {
      errRef.current = q.error;
      onError?.(q.error as TError);
      onSettled?.(undefined, q.error as TError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.error]);

  // v5 returns a tracking Proxy: every property read marks that prop tracked,
  // and reading `promise` rejects a pendingThenable when prefetchInRender is
  // off. Spreading it (`{...q}`) therefore enumerates every getter on EVERY
  // render → all-props tracking + a rejected-thenable microtask per render,
  // which sustained an infinite dev-only re-render loop. Delegate instead.
  return React.useMemo(
    () =>
      new Proxy(q as any, {
        get: (t, p) => (p === 'isLoading' ? t.isPending : Reflect.get(t, p)),
      }),
    [q],
  ) as typeof q & { isLoading: boolean };
}

/* ── useInfiniteQuery ─────────────────────────────────────────────────────── */
export function useInfiniteQuery<TData = unknown, TError = unknown>(
  key: any,
  fn: (ctx: { queryKey: any; pageParam?: any }) => Promise<TData> | TData,
  opts: V3QueryOpts<TData, TError> & {
    getNextPageParam?: (lastPage: TData, allPages: TData[]) => any;
  } = {},
) {
  const { onSuccess, onError, keepPreviousData, cacheTime, getNextPageParam, ...rest } = opts;
  // Internal cast: the shim exposes v3-typed options; v5's InfiniteData-aware
  // generics reject the pass-through `select`/`initialData` shapes even though
  // the runtime semantics line up. V1 never uses select on infinite queries.
  const q = useInfiniteQueryV5<any, TError>({
    queryKey: toArr(key),
    queryFn: (ctx: any) => fn({ queryKey: ctx.queryKey as any, pageParam: ctx.pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any, allPages: any) => {
      const r = getNextPageParam?.(lastPage, allPages);
      return r === false || r == null ? undefined : r;
    },
    ...(keepPreviousData ? { placeholderData: keepPreviousDataFn } : {}),
    ...(cacheTime !== undefined ? { gcTime: cacheTime } : {}),
    ...rest,
  } as any);

  const dataRef = React.useRef<any>(undefined);
  React.useEffect(() => {
    if (q.data !== undefined && q.data !== dataRef.current) {
      dataRef.current = q.data;
      onSuccess?.(q.data as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);
  const errRef = React.useRef<any>(undefined);
  React.useEffect(() => {
    if (q.error && q.error !== errRef.current) {
      errRef.current = q.error;
      onError?.(q.error as TError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.error]);

  // Same delegating Proxy as useQuery — never enumerate the tracked result
  // (isFetchingNextPage is a real v5 prop and passes straight through).
  return React.useMemo(
    () =>
      new Proxy(q as any, {
        get: (t, p) => (p === 'isLoading' ? t.isPending : Reflect.get(t, p)),
      }),
    [q],
  ) as typeof q & { isLoading: boolean };
}

/* ── useMutation ──────────────────────────────────────────────────────────── */
export function useMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  fn: (vars: TVariables) => Promise<TData>,
  opts: {
    onSuccess?: (data: TData, vars: TVariables, ctx?: TContext) => void;
    onError?: (error: TError, vars: TVariables, ctx?: TContext) => void;
    onSettled?: (data: TData | undefined, error: TError | null, vars: TVariables, ctx?: TContext) => void;
    onMutate?: (vars: TVariables) => Promise<TContext> | TContext;
    [k: string]: any;
  } = {},
) {
  const m = useMutationV5<TData, TError, TVariables, TContext>({
    mutationFn: fn,
    ...(opts as any),
  });
  return { ...m, isLoading: m.isPending } as typeof m & { isLoading: boolean };
}

/* ── useQueryClient (string-key compat via Proxy) ─────────────────────────── */
const STRING_KEY_METHODS = new Set([
  'invalidateQueries',
  'refetchQueries',
  'removeQueries',
  'cancelQueries',
  'resetQueries',
]);

/** v3 accepted string / string[] query keys on these — type them loosely. */
type CompatQueryClient = Omit<
  QueryClientV5,
  'invalidateQueries' | 'refetchQueries' | 'removeQueries' | 'cancelQueries' | 'resetQueries'
> & {
  invalidateQueries: (arg?: any, opts?: any) => Promise<void>;
  refetchQueries: (arg?: any, opts?: any) => Promise<void>;
  removeQueries: (arg?: any) => void;
  cancelQueries: (arg?: any) => Promise<void>;
  resetQueries: (arg?: any, opts?: any) => Promise<void>;
};

function wrapClient(client: QueryClientV5): CompatQueryClient {
  return new Proxy(client, {
    get(target: any, prop: string) {
      const orig = target[prop];
      if (typeof orig === 'function' && STRING_KEY_METHODS.has(prop)) {
        return (arg?: any, ...restArgs: any[]) => {
          if (typeof arg === 'string' || Array.isArray(arg)) {
            return orig.call(target, { queryKey: toArr(arg) }, ...restArgs);
          }
          return orig.call(target, arg, ...restArgs);
        };
      }
      if (typeof orig === 'function') return orig.bind(target);
      return orig;
    },
  }) as unknown as CompatQueryClient;
}

export function useQueryClient(): CompatQueryClient {
  const client = useQueryClientV5();
  return React.useMemo(() => wrapClient(client), [client]);
}

/* ── QueryClient / hydration / misc re-exports ────────────────────────────── */
export class QueryClient extends QueryClientV5 {
  constructor(config?: any) {
    // v3 config shape { defaultOptions: { queries: {...} } } is v5-compatible
    // except cacheTime → gcTime.
    if (config?.defaultOptions?.queries?.cacheTime !== undefined) {
      const { cacheTime, ...q } = config.defaultOptions.queries;
      config = { ...config, defaultOptions: { ...config.defaultOptions, queries: { ...q, gcTime: cacheTime } } };
    }
    super(config);
  }

  // v3 accepted string/array keys directly on these methods.
  invalidateQueries(arg?: any, ...rest: any[]): Promise<void> {
    if (typeof arg === 'string' || Array.isArray(arg)) {
      return super.invalidateQueries({ queryKey: toArr(arg) } as any, ...(rest as [any]));
    }
    return super.invalidateQueries(arg, ...(rest as [any]));
  }
  refetchQueries(arg?: any, ...rest: any[]): Promise<void> {
    if (typeof arg === 'string' || Array.isArray(arg)) {
      return super.refetchQueries({ queryKey: toArr(arg) } as any, ...(rest as [any]));
    }
    return super.refetchQueries(arg, ...(rest as [any]));
  }
  removeQueries(arg?: any): void {
    if (typeof arg === 'string' || Array.isArray(arg)) {
      return super.removeQueries({ queryKey: toArr(arg) } as any);
    }
    return super.removeQueries(arg);
  }
  resetQueries(arg?: any, ...rest: any[]): Promise<void> {
    if (typeof arg === 'string' || Array.isArray(arg)) {
      return super.resetQueries({ queryKey: toArr(arg) } as any, ...(rest as [any]));
    }
    return super.resetQueries(arg, ...(rest as [any]));
  }
}

export const Hydrate = HydrationBoundary;
export { dehydrate };
export const useIsFetching = useIsFetchingV5;
export const useIsMutating = useIsMutatingV5;

/** V1 imports ReactQueryDevtools from 'react-query' in dev only — no-op here. */
export const ReactQueryDevtools = (_props: any) => null;
