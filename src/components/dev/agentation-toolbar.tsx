'use client';

import { useEffect, useState, type ComponentType } from 'react';

/**
 * Dev/staging-only Agentation visual-feedback toolbar.
 *
 * Renders ONLY on staging or localhost (hostname gate) so it can NEVER appear
 * on production (www.plantathome.in). Annotations sync to the local
 * `agentation-mcp` server (http://localhost:4747), which exposes them to the
 * coding agent via MCP.
 *
 * DEFAULT ON for staging/localhost (the owner uses it to annotate staging).
 * `?agentation=0` disables it in this browser (persists via localStorage),
 * `?agentation=1` re-enables. Note: without the local relay running, the
 * toolbar's localhost:4747 polls log unsuppressable CORS/loopback console
 * errors — the QA specs therefore pre-seed `pah-agentation=off` themselves so
 * the zero-console-error gates stay meaningful.
 *
 * Mounted-state gate (not next/dynamic): renders null on the server AND on the
 * client's first hydration pass, so there is no SSR/client mismatch — dynamic
 * imports of always-rendered components are a known hydration-loop trap in
 * this app.
 *
 * The `agentation` package is pulled in with a DYNAMIC import() rather than a
 * static one, and only after both gates have passed. This is a bundle
 * decision, not a behavioural one:
 *
 *   A static import puts the package in the eagerly-loaded chunk graph for
 *   every route, on every host. Measured on a production build, that was a
 *   443,873-byte chunk — 21.8% of all the JavaScript the home page loads —
 *   shipped to every real customer for a toolbar the hostname gate guarantees
 *   will never render for them.
 *
 * Deferring the import moves it into its own async chunk, requested only once
 * the hostname check passes, so staging and localhost behave exactly as before
 * and production never fetches it at all.
 *
 * Note this is import() and NOT next/dynamic — next/dynamic on an
 * always-rendered component is the hydration-loop trap referenced above. Here
 * the component still returns null until its own effect has run, so the
 * server-rendered output and the first client pass stay identical.
 */
export default function AgentationToolbar() {
  const [Toolbar, setToolbar] = useState<ComponentType<{ endpoint: string }> | null>(null);

  useEffect(() => {
    let enabled: boolean;
    try {
      const q = new URLSearchParams(window.location.search).get('agentation');
      if (q === '1') localStorage.removeItem('pah-agentation');
      if (q === '0') localStorage.setItem('pah-agentation', 'off');
      enabled = localStorage.getItem('pah-agentation') !== 'off';
    } catch {
      /* storage unavailable → default enabled (hostname gate still applies) */
      enabled = true;
    }

    if (!enabled) return;

    const host = window.location.hostname;
    const allowed =
      host.includes('staging') || host === 'localhost' || host === '127.0.0.1';

    if (!allowed) return;

    // Only now is the package worth fetching.
    let cancelled = false;
    import('agentation')
      .then((m) => {
        // A function value has to be wrapped in setState — React would
        // otherwise treat the component itself as a state updater.
        if (!cancelled) setToolbar(() => m.Agentation);
      })
      .catch(() => {
        /* toolbar is a dev convenience; never break the page over it */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!Toolbar) return null;

  return <Toolbar endpoint="http://localhost:4747" />;
}
