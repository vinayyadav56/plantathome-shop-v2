import { IconSpray } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * DB-keyed palette glyph. Filename and export name are pinned by database
 * records -- redraw in place, NEVER rename.
 * A spray bottle: plant feed/mist. The previous bottle read as a drink.
 */
export const Feeders: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconSpray) as unknown as React.FC<React.SVGAttributes<{}>>;
