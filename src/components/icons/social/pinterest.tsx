import { IconBrandPinterest } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * Brand mark. The export name is DB-keyed (settings.contactDetails.socials
 * stores it), so redraw in place, never rename.
 * Was a Simple Icons path; already 24 but filled.
 */
export const PinterestIcon: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconBrandPinterest) as unknown as React.FC<React.SVGAttributes<{}>>;
