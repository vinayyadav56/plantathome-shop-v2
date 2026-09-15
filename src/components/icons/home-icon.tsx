import { Home } from '@/components/ui/icon';

/** Frozen legacy name. Was a filled 18x20 traced path on its own grid; now the
 *  funnel glyph on the 24 grid at the house weight. */
export const HomeIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Home aria-hidden {...(props as any)} />
);
