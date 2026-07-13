import { productPlaceholder } from '@/lib/placeholders';

/**
 * SVG placeholders import as a static-image object ({ src }) under next/image,
 * which renders as "[object Object]" if used directly as an <img src>. Resolve
 * to the URL string here.
 */
export const PLACEHOLDER: string =
  (productPlaceholder as any)?.src ?? (productPlaceholder as unknown as string);
