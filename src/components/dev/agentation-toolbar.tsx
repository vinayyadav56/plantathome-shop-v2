'use client';

import { useEffect, useState } from 'react';
import { Agentation } from 'agentation';

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
 */
export default function AgentationToolbar() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('agentation');
      if (q === '1') localStorage.removeItem('pah-agentation');
      if (q === '0') localStorage.setItem('pah-agentation', 'off');
      setEnabled(localStorage.getItem('pah-agentation') !== 'off');
    } catch {
      /* storage unavailable → default enabled (hostname gate still applies) */
      setEnabled(true);
    }
  }, []);

  if (!enabled) return null;

  const host = window.location.hostname;
  const allowed =
    host.includes('staging') || host === 'localhost' || host === '127.0.0.1';

  if (!allowed) return null;

  return <Agentation endpoint="http://localhost:4747" />;
}
