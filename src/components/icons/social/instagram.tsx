import { IconBrandInstagram } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * Brand mark. The export name is DB-keyed (settings.contactDetails.socials
 * stores it), so redraw in place, never rename.
 * Was an ionicons path on a 12x12 box.
 */
export const InstagramIcon: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconBrandInstagram) as unknown as React.FC<React.SVGAttributes<{}>>;
