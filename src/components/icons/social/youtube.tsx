import { IconBrandYoutube } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * Brand mark. The export name is DB-keyed (settings.contactDetails.socials
 * stores it), so redraw in place, never rename.
 * Was a path on a 15.997x12 box.
 */
export const YouTubeIcon: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconBrandYoutube) as unknown as React.FC<React.SVGAttributes<{}>>;
