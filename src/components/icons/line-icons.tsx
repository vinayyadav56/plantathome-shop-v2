import {
  ArrowRight,
  Bike,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Droplet,
  ExternalLink,
  Flower2,
  Gift,
  Globe,
  Heart,
  Home,
  Leaf,
  Menu,
  Package,
  Play,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Truck,
  type LucideIcon,
  Wrench,
} from '@/components/ui/icon';

/**
 * Name-keyed icon funnel, now backed by Lucide (docs/design/icon-system.md).
 * The name→glyph keys are frozen so existing call sites keep working; new code
 * should import from '@/components/ui/icon' directly.
 */
const GLYPHS: Record<string, LucideIcon> = {
  leaf: Flower2,
  lotus: Flower2,
  menu: Menu,
  cart: ShoppingBag,
  arrowRight: ArrowRight,
  droplet: Droplet,
  truck: Truck,
  bike: Bike,
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
  // admin-pickable section-heading glyphs (homeSections[].icon); unknown or
  // blank names fall back to Flower2 below, so any string is safe to store.
  flower: Flower2,
  sprout: Flower2,
  realLeaf: Leaf,
  sun: Sun,
  heart: Heart,
  gift: Gift,
  star: Star,
  home: Home,
  package: Package,
  sparkles: Sparkles,
  tools: Wrench,
};

export function LineIcon({
  name,
  className = 'h-4 w-4',
}: {
  name: keyof typeof GLYPHS | string;
  className?: string;
}) {
  const Glyph = GLYPHS[name];
  if (!Glyph && process.env.NODE_ENV !== 'production') {
    console.warn('[icons] LineIcon unmapped name:', name);
  }
  const Resolved = Glyph ?? Flower2;
  return <Resolved className={className} aria-hidden />;
}

export default LineIcon;
