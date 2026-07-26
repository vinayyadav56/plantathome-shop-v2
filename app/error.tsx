'use client';

/**
 * Route-level error boundary. There was none anywhere in the App Router, so a
 * render error on any of the ~40 routes fell through to a blank page with no way
 * back — the worst possible outcome on a storefront, because it looks like the
 * shop is gone rather than like one page failed.
 *
 * Deliberately dependency-free: it must render when the thing that broke may be
 * the data layer, the settings provider, or the theme applier. No hooks beyond
 * the boundary contract, no useSettings, no translations (a missing i18n context
 * is itself a plausible cause of landing here).
 */

import { useEffect } from 'react';
import { PlantLoader } from '@/components/ui/plant-loader';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface it once for whoever is watching the console / error reporter.
    // eslint-disable-next-line no-console
    console.error('[route-error]', error?.message, error?.digest ?? '');
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center bg-cream px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center opacity-40">
          <PlantLoader size="lg" />
        </div>

        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-stone-500">
          Something went wrong
        </p>
        <h1 className="mb-4 text-2xl font-semibold leading-snug text-forest-900 sm:text-3xl">
          This page didn&apos;t load
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-stone-600">
          The rest of the shop is fine — it&apos;s just this page. Try again, or head
          back to the plants.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg bg-ds-btn px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ds-btn-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 sm:w-auto"
          >
            Try again
          </button>
          {/* A plain anchor, not next/link: if the router is what broke, a hard
              navigation is the only reliable way out. */}
          <a
            href="/"
            className="w-full rounded-lg border border-kraft-200 px-6 py-3 text-sm font-semibold text-forest-900 transition-colors hover:bg-sage-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 sm:w-auto"
          >
            Back to home
          </a>
        </div>

        {error?.digest ? (
          <p className="mt-8 font-mono text-[11px] text-stone-400">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
