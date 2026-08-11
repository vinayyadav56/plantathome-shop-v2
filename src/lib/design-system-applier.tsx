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

  useEffect(() => {
    // Design system first (sets its own font pairing) …
    applyDesignSystem(designSystem, true);
    // … then the website fonts win (Inter body + Cormorant headings by default).
    // Re-runs whenever the design system OR either font changes.
    applyTypography(fontFamily, headingFontFamily, true);
  }, [JSON.stringify(designSystem ?? null), fontFamily, headingFontFamily]);

  return null;
}
