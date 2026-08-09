import { EllipsisVertical } from '@/components/ui/icon';

// Legacy glyph was a vertical 3-dot kebab ("more actions"), not a hamburger.
export const MenuIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <EllipsisVertical aria-hidden {...(props as any)} />
);
