import { ChevronDown } from '@/components/ui/icon';

// NOTE: the legacy glyph in this file was a chevron-down caret (not a globe),
// so ChevronDown preserves the rendered shape.
export const LangSwitcherIcon: React.FC<React.SVGAttributes<{}>> = ({
  color = 'currentColor',
  width = '14px',
  height = '10px',
  ...props
}) => (
  <ChevronDown
    aria-hidden
    color={color}
    width={width}
    height={height}
    {...(props as any)}
  />
);
