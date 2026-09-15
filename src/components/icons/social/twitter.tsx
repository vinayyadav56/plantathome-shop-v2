import { IconBrandX } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * Brand mark. The export name is DB-keyed (settings.contactDetails.socials
 * stores it), so redraw in place, never rename.
 * Was the retired Twitter BIRD on a 14.747x12 box; now the X mark.
 */
export const TwitterIcon: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconBrandX) as unknown as React.FC<React.SVGAttributes<{}>>;
