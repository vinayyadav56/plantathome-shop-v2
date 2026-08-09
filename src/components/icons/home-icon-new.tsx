import { Home } from '@/components/ui/icon';

export const HomeIconNew: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Home aria-hidden {...(props as any)} />
);

export const ShopHomeIcon: React.FC<React.SVGAttributes<{}>> = (props) => {
  return <Home aria-hidden {...(props as any)} />;
};
