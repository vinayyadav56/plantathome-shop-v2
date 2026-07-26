'use client';
import { useEffect } from 'react';
import { useSettings } from '@/framework/settings';
import { applyDesignSystem } from '@/lib/design-system';
import { applyTypography } from '@/lib/typography';

/**
 * Applies the admin-configured Design System (accent / density / buttons) AND the
 * website fonts (settings.options.typography.fontFamily body + .headingFontFamily
 * display serif, defaults Inter + Playfair Display) to the storefront at runtime,
 * persisting both for the next load's pre-paint scripts. Renders nothing.
 *
 * The two are applied in ONE effect so the typography is ALWAYS set LAST, after
 * the design system's own --font-heading/--font-body writes — guaranteeing the
 * admin font choices win (no race with a separate applier that might not re-run).
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
    // … then the website fonts win (Inter body + Playfair headings by default).
    // Re-runs whenever the design system OR either font changes.
    applyTypography(fontFamily, headingFontFamily, true);
  }, [JSON.stringify(designSystem ?? null), fontFamily, headingFontFamily]);

  return null;
}
