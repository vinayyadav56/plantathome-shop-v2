'use client';
import { useEffect } from 'react';
import { useSettings } from '@/framework/settings';
import { applyDesignSystem } from '@/lib/design-system';
import { applyTypography } from '@/lib/typography';

/**
 * Applies the admin-configured Design System (accent / density / buttons) AND the
 * single website font (settings.options.typography.fontFamily, default Inter) to
 * the storefront at runtime, persisting both for the next load's pre-paint scripts.
 * Renders nothing. Mounted once.
 *
 * The two are applied in ONE effect so the website font is ALWAYS set LAST, after
 * the design system's own --font-heading/--font-body writes — guaranteeing the
 * single font wins (no race with a separate applier that might not re-run).
 */
export default function DesignSystemApplier() {
  const { settings } = useSettings() as any;
  const designSystem = settings?.designSystem;
  const fontFamily: string | undefined = settings?.typography?.fontFamily;

  useEffect(() => {
    // Design system first (sets its own font pairing) …
    applyDesignSystem(designSystem, true);
    // … then the single website font wins (default Inter). Re-runs whenever the
    // design system OR the font changes, so it re-asserts after any DS update.
    applyTypography(fontFamily, true);
  }, [JSON.stringify(designSystem ?? null), fontFamily]);

  return null;
}
