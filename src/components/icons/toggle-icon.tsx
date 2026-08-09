import { Ellipsis } from '@/components/ui/icon';

// Legacy glyph was a horizontal 3-dot ellipsis (popover "more" trigger).
export const ToggleIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Ellipsis aria-hidden {...(props as any)} />
);
