'use client';
import { useEffect } from 'react';
import { useSettings } from '@/framework/settings';
import { applyTypography } from '@/lib/typography';

/**
 * Applies the admin-configured website font (settings.options.typography.fontFamily,
 * default Inter) to the whole storefront at runtime and persists it for the next
 * load's pre-paint script. Renders nothing. Mounted AFTER <DesignSystemApplier />
 * so the single website font wins over the design-system's split heading/body fonts.
 */
export default function TypographyApplier() {
  const { settings } = useSettings() as any;
  const fontFamily: string | undefined = settings?.typography?.fontFamily;

  useEffect(() => {
    applyTypography(fontFamily, true);
  }, [fontFamily]);

  return null;
}
