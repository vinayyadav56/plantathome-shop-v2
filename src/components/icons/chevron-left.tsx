import {
  ArrowLeft,
  ChevronLeft as ChevronLeftGlyph,
} from '@/components/ui/icon';

export const ChevronLeft: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ChevronLeftGlyph aria-hidden {...(props as any)} />
);

export const IosGhostArrowLeft: React.FC<React.SVGAttributes<{}>> = (
  props,
) => {
  return <ArrowLeft aria-hidden {...(props as any)} />;
};
