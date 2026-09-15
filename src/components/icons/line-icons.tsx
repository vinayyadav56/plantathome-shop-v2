import {
  LayoutGrid,
  ArrowRight,
  Bike,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Dot,
  Droplet,
  Droplets,
  ExternalLink,
  Flower,
  Flower2,
  Gift,
  Globe,
  Heart,
  Home,
  Leaf,
  Menu,
  Package,
  PawPrint,
  Play,
  Plus,
  PottedPlant,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Shovel,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Thermometer,
  Truck,
  Wind,
  Wrench,
  type LucideIcon,
} from '@/components/ui/icon';

/**
 * Name-keyed icon funnel, now backed by Lucide (docs/design/icon-system.md).
 * The name→glyph keys are frozen so existing call sites keep working; new code
 * should import from '@/components/ui/icon' directly.
 */
const GLYPHS: Record<string, LucideIcon> = {
  leaf: Leaf,
  lotus: Flower,
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
  flower: Flower,
  sprout: Sprout,
  realLeaf: Leaf,
  sun: Sun,
  heart: Heart,
  gift: Gift,
  star: Star,
  home: Home,
  package: Package,
  sparkles: Sparkles,
  tools: Wrench,
  // plant-domain concepts (also admin-pickable)
  wind: Wind,
  paw: PawPrint,
  soil: Shovel,
  prune: Scissors,
  plant: PottedPlant,
  thermometer: Thermometer,
  humidity: Droplets,
  // neutral section marks -- deliberately not botanical
  grid: LayoutGrid,
  dot: Dot,
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
  // Neutral on purpose. A botanical fallback made an unmapped name look
  // deliberate, which is how a wrong icon ships unnoticed.
  const Resolved = Glyph ?? Dot;
  return <Resolved className={className} aria-hidden />;
}

export default LineIcon;
