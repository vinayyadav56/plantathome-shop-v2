import { ChevronRight as ChevronRightGlyph } from '@/components/ui/icon';

export const ChevronRight: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ChevronRightGlyph aria-hidden {...(props as any)} />
);
