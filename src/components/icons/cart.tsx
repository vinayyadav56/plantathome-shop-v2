import { FC } from 'react';
import { ShoppingBag } from '@/components/ui/icon';

type CartProps = {
  width?: number;
  height?: number;
  className?: string;
};

const Cart: FC<CartProps> = (props) => {
  return <ShoppingBag aria-hidden {...(props as any)} />;
};

export default Cart;
