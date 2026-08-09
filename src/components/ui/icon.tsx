import type { LucideIcon, LucideProps } from 'lucide-react';

/**
 * The single icon system for the storefront (docs/design/icon-system.md in the
 * main repo). Lucide only — import glyphs from THIS file, never from
 * 'lucide-react' directly, so concept→icon stays pinned in one place.
 *
 * Standard: outline, strokeWidth 2, currentColor, default 20px,
 * sizes 16/18/20/24/32/40/48. Decorative icons are aria-hidden; pass `label`
 * only when the icon is the sole content of an interactive element.
 *
 * Deliberately NOT here: social brand glyphs (Lucide dropped them — use
 * components/icons/social/*) and the DB-driven category/group palettes.
 */
type IconSize = 16 | 18 | 20 | 24 | 32 | 40 | 48;

type IconProps = {
  as: LucideIcon;
  size?: IconSize;
  label?: string;
} & Omit<LucideProps, 'ref' | 'size'>;

export function Icon({ as: Glyph, size = 20, strokeWidth = 2, label, ...rest }: IconProps) {
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...rest}
    />
  );
}

// Approved glyph set. Adding a concept = adding one export here.
export {
  // commerce
  ShoppingBag, Search, Heart, Star, Gift, CreditCard, Wallet, Receipt, Tag, Percent,
  // fulfilment
  Truck, Bike, Package, MapPin, Clock, CalendarDays, Timer, RefreshCw, RotateCcw, Flag, Headset, Box,
  // status
  Check, CircleCheck, X, CircleX, TriangleAlert, CircleAlert, Info, ShieldCheck, BadgeCheck, Lock,
  // navigation
  Menu, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowRight, ArrowLeft, ArrowDown, ArrowUp,
  Home, ExternalLink, LayoutGrid, SlidersHorizontal, LogOut,
  // account & contact
  User, UserRound, Phone, Mail, MessageCircle, Smartphone, Bell, Share2, Copy, Eye, EyeOff,
  // plants & care
  Leaf, Sprout, Flower2, Droplet, Sun, Moon, Wind, Thermometer, Ruler, Wrench, Layers, Earth,
  // misc UI
  Plus, Minus, Pencil, Trash2, Camera, Globe, Play, Quote, Zap, Sparkles, WandSparkles, Building2,
  TrendingUp, VolumeX, Mic, Send, CircleHelp, FileText, Settings, Navigation, Crosshair, Download,
  ThumbsUp, ThumbsDown, Hand, Upload, Ellipsis, EllipsisVertical,
} from 'lucide-react';

export type { LucideIcon, LucideProps } from 'lucide-react';
