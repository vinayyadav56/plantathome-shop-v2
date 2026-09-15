import { Check } from '@/components/ui/icon';

/** Frozen legacy name. Now the funnel glyph, so it follows the house weight. */
const CheckIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Check aria-hidden {...(props as any)} />
);

export default CheckIcon;
