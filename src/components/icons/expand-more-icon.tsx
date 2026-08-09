import { ChevronUp } from '@/components/ui/icon';

// NOTE: the legacy glyph in this file actually drew a chevron pointing UP
// (despite the "more" name), so ChevronUp preserves the rendered shape.
export const ExpandMoreIcon: React.FC<React.SVGAttributes<{}>> = (props) => (
  <ChevronUp aria-hidden {...(props as any)} />
);
