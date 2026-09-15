import { IconShovel } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * DB-keyed palette glyph. Filename and export name are pinned by database
 * records -- redraw in place, NEVER rename.
 * A shovel, not a WRENCH: this is a plant shop's garden-tools rail.
 */
export const Tools: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconShovel) as unknown as React.FC<React.SVGAttributes<{}>>;
