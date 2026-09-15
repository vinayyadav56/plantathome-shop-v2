import { IconSpray } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/**
 * DB-keyed palette glyph. The filename and export name are pinned by records
 * in the database -- redraw in place, NEVER rename.
 * Was a traced Pickbazar asset on its own viewBox with a hardcoded palette;
 * now the shared 24 grid at the house weight, following currentColor.
 */
export const HomeCleaning: React.FC<React.SVGAttributes<{}>> = paletteIcon(IconSpray) as unknown as React.FC<React.SVGAttributes<{}>>;
