import { IconBrandGoogle } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * Brand mark. The export name is DB-keyed (settings.contactDetails.socials
 * stores it), so redraw in place, never rename.
 * Was a single-path monochrome G on a 19.986x20.39 box.
 */
export const GoogleIcon: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconBrandGoogle) as unknown as React.FC<React.SVGAttributes<{}>>;
