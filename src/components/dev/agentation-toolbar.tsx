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
 * Mounted-state gate (not next/dynamic): renders null on the server AND on the
 * client's first hydration pass, so there is no SSR/client mismatch — dynamic
 * imports of always-rendered components are a known hydration-loop trap in
 * this app.
 */
export default function AgentationToolbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const host = window.location.hostname;
  const allowed =
    host.includes('staging') || host === 'localhost' || host === '127.0.0.1';

  if (!allowed) return null;

  return <Agentation endpoint="http://localhost:4747" />;
}
