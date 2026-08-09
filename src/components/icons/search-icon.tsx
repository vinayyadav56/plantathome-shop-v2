import { Search } from '@/components/ui/icon';

export const SearchIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <Search aria-hidden {...(props as any)} />
);
