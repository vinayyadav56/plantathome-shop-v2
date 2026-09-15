import { IconBrandWhatsapp } from '@tabler/icons-react';
import { paletteIcon } from '@/components/ui/icon';

/** Brand mark on the shared 24 grid at the house weight. Both names are kept:
 *  the file previously exported WhatsAppIcon as a const AND as default. */
export const WhatsAppIcon: React.FC<React.SVGAttributes<{}>> = paletteIcon(
  IconBrandWhatsapp,
) as unknown as React.FC<React.SVGAttributes<{}>>;

export default WhatsAppIcon;
