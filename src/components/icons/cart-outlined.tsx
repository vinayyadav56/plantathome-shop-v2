import { ShoppingBag } from '@/components/ui/icon';

export const CartOutlinedIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ShoppingBag aria-hidden {...(props as any)} />
);
