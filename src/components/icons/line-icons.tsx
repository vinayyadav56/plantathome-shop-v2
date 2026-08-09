import {
  ArrowRight,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Droplet,
  ExternalLink,
  Flower2,
  Globe,
  Leaf,
  Menu,
  Play,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from '@/components/ui/icon';

/**
 * Name-keyed icon funnel, now backed by Lucide (docs/design/icon-system.md).
 * The name→glyph keys are frozen so existing call sites keep working; new code
 * should import from '@/components/ui/icon' directly.
 */
const GLYPHS: Record<string, LucideIcon> = {
  leaf: Leaf,
  lotus: Flower2,
  menu: Menu,
  cart: ShoppingBag,
  arrowRight: ArrowRight,
  droplet: Droplet,
  truck: Truck,
  language: Globe,
  check: Check,
  box: Box,
  alert: CircleAlert,
  play: Play,
  external: ExternalLink,
  plus: Plus,
  shield: ShieldCheck,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
};

export function LineIcon({
  name,
  className = 'h-4 w-4',
  strokeWidth = 2,
}: {
  name: keyof typeof GLYPHS | string;
  className?: string;
  strokeWidth?: number;
}) {
  const Glyph = GLYPHS[name];
  if (!Glyph && process.env.NODE_ENV !== 'production') {
    console.warn('[icons] LineIcon unmapped name:', name);
  }
  const Resolved = Glyph ?? Leaf;
  return <Resolved className={className} strokeWidth={strokeWidth} aria-hidden />;
}

export default LineIcon;
