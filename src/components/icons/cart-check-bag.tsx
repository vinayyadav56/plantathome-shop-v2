import { FC } from 'react';
import { ShoppingBag } from '@/components/ui/icon';

type CartCheckBagProps = {
  width?: number;
  height?: number;
  className?: string;
};

const CartCheckBag: FC<CartCheckBagProps> = (props) => {
  return <ShoppingBag aria-hidden {...(props as any)} />;
};

export default CartCheckBag;
