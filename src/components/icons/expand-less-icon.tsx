import { ChevronDown } from '@/components/ui/icon';

// NOTE: the legacy glyph in this file actually drew a chevron pointing DOWN
// (despite the "less" name), so ChevronDown preserves the rendered shape.
export const ExpandLessIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ChevronDown aria-hidden {...(props as any)} />
);
