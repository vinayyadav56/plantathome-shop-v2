"use client";

/**
 * Stale-build recovery for lazily loaded code on customer-critical paths.
 *
 * WHY THIS EXISTS
 * Every deploy mints new hashed chunk filenames. A tab loaded before a deploy still
 * references the OLD names, so the first lazy import it performs afterwards fetches a file
 * the server no longer has. In checkout that import happens at the exact moment the
 * customer acts — mounting the verified item list after "Check Availability", opening the
 * payment modal — so the click dead-ends, and the "second attempt works" only because the
 * app has meanwhile reloaded onto the fresh build.
 *
 * The primary fixes are elsewhere: the components on the money path are statically imported
 * now, and the production deploy keeps the previous build's static assets. This is the belt
 * for whatever stays lazy — recover by reloading onto the current build, but ONLY for a
 * genuine chunk failure, ONLY once per window, and only after the checkout page has saved
 * the customer's step, so the reload is invisible rather than destructive.
 *
 * Usage keeps next/dynamic's own call shape (its options must remain an object literal at
 * the call site, which is why this wraps the loader and not dynamic() itself):
 *
 *   const Thing = dynamic(() => retryImport(() => import('./thing')), { ssr: false });
 */

const RELOAD_GUARD_KEY = "pah-chunk-reload-at";
const RELOAD_WINDOW_MS = 2 * 60 * 1000;

/** A failed chunk/module fetch — not an error thrown by the component itself. */
export function isChunkLoadError(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | undefined;
  const msg = `${e?.name ?? ""} ${e?.message ?? ""}`;
  return /ChunkLoadError|Loading chunk .*failed|failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|css chunk/i.test(
    msg,
  );
}

/**
 * Reload onto the current build. Guarded so a genuinely broken chunk cannot loop: one
 * reload per 2-minute window (a multi-deploy day can legitimately go stale twice).
 * Returns false when the guard refuses, so the caller surfaces the real error instead.
 */
export function reloadOntoCurrentBuild(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
    if (last && Date.now() - last <= RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    /* storage unavailable (private window) — still worth one reload attempt */
  }
  window.location.reload();
  return true;
}

/**
 * Wrap a dynamic import so a stale-build chunk failure self-heals instead of dead-ending.
 * Any other error is rethrown untouched: this must never swallow a real bug.
 */
export function retryImport<T>(loader: () => Promise<T>): Promise<T> {
  return loader().catch((error: unknown) => {
    if (isChunkLoadError(error) && reloadOntoCurrentBuild()) {
      // The reload is in flight; resolve to an empty module so the tree does not error
      // out in the frames before the navigation commits.
      return { default: () => null } as unknown as T;
    }
    throw error;
  });
}

// deploy-boundary verification marker: 1789399327
