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
 * OPT-IN: visit any page with `?agentation=1` to enable (persists in this
 * browser via localStorage), `?agentation=0` to disable. Without opt-in the
 * component polls localhost:4747 on every staging page view, and for anyone
 * not running the local relay the browser logs an unsuppressable CORS/loopback
 * error per poll — which broke the zero-console-error QA gate sitewide.
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
      if (q === '1') localStorage.setItem('pah-agentation', 'on');
      if (q === '0') localStorage.removeItem('pah-agentation');
      setEnabled(localStorage.getItem('pah-agentation') === 'on');
    } catch {
      /* storage unavailable → stay disabled */
    }
  }, []);

  if (!enabled) return null;

  const host = window.location.hostname;
  const allowed =
    host.includes('staging') || host === 'localhost' || host === '127.0.0.1';

  if (!allowed) return null;

  return <Agentation endpoint="http://localhost:4747" />;
}
