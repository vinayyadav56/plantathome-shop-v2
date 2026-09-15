'use client';
import { useEffect } from 'react';
import { useSettings } from '@/framework/settings';
import { applyDesignSystem } from '@/lib/design-system';
import { applyTypography } from '@/lib/typography';

/**
 * Applies the admin-configured Design System (font pairing / accent / density /
 * buttons) AND the website fonts (settings.options.typography) to the
 * storefront at runtime, persisting both for the next load's pre-paint
 * scripts. Renders nothing.
 *
 * The two are applied in ONE effect so typography runs LAST — but a typography
 * axis only overrides the design-system pairing when the admin EXPLICITLY set
 * it (a family, or '' = same-as-body for headings). An unset axis defers, so
 * the Design System page's font pairing actually reaches the storefront.
 */
export default function DesignSystemApplier() {
  const { settings } = useSettings() as any;
  const designSystem = settings?.designSystem;
  const fontFamily: string | undefined = settings?.typography?.fontFamily;
  const headingFontFamily: string | undefined =
    settings?.typography?.headingFontFamily;

  // Only PERSIST once real settings have arrived. Persisting while settings are
  // still absent wrote the DEFAULT theme to localStorage, which the next visit's
  // pre-paint script then applied before the real theme loaded — a second source
  // of "old look first, correct look after". Applying without persisting is
  // still correct: the defaults are what the page would render anyway.
  const hasSettings = Boolean(settings && Object.keys(settings).length > 0);

  useEffect(() => {
    // Design system first (sets its own font pairing) …
    applyDesignSystem(designSystem, hasSettings);
    // … then the website fonts win (Inter body + Cormorant headings by default).
    // Re-runs whenever the design system OR either font changes.
    applyTypography(fontFamily, headingFontFamily, hasSettings);
  }, [JSON.stringify(designSystem ?? null), fontFamily, headingFontFamily, hasSettings]);

  return null;
}
