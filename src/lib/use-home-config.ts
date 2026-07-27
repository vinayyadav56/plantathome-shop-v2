import { useSettings } from '@/framework/settings';

/** Admin-editable "Why Plants" section content (settings.options.whyPlants). */
export type WhyPlantsConfig = {
  heading?: string;
  subtitle?: string;
  cards?: Array<{
    title?: string;
    body?: string;
    image?: { original?: string; thumbnail?: string } | string | null;
    iconKey?: string;
    order?: number;
  }>;
};

/** Admin-editable Collections section (settings.options.homeCollections). */
export type HomeCollectionsConfig = {
  enabled?: boolean;
  eyebrow?: string;
  heading?: string;
  count?: number;
  cards?: Array<{
    categorySlug?: string;
    image?: { original?: string; thumbnail?: string } | string | null;
    title?: string;
    subtitle?: string;
    order?: number;
  }>;
};

/** Admin-editable "Six worlds" verticals band (settings.options.verticalsBand). */
export type VerticalsBandConfig = {
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  tiles?: Array<{
    typeSlug?: string;
    tagline?: string;
    image?: { original?: string; thumbnail?: string } | string | null;
    order?: number;
    comingSoon?: boolean;
  }>;
};

/** Admin-editable desktop hero — image + copy + chips + the two overlay stat
    cards (settings.options.homeHero). Exactly two stat cards are rendered. */
export type HomeHeroConfig = {
  image?: { original?: string; thumbnail?: string } | string | null;
  headline?: string;
  subheadline?: string;
  chips?: string[];
  statCards?: Array<{ value?: string; label?: string }>;
};

/** Admin-editable Corporate Gifting page content (settings.options.giftingContent). */
export type GiftingImage =
  | { original?: string; thumbnail?: string }
  | string
  | null;
export type GiftingContentConfig = {
  heroImage?: GiftingImage;
  galleryEyebrow?: string;
  galleryHeading?: string;
  gallerySubtitle?: string;
  gallery?: Array<{
    image?: GiftingImage;
    caption?: string;
    order?: number;
  }>;
};

/** Resolve a CMS image field (object|string|null) to a usable URL, or ''. */
export function resolveImageUrl(img: GiftingImage): string {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img.original ?? img.thumbnail ?? '';
}

/** Corporate Gifting page CMS block (gallery + optional hero image). */
export function useGiftingConfig(): GiftingContentConfig | null {
  const { settings } = useSettings() as any;
  return (settings?.giftingContent ?? null) as GiftingContentConfig | null;
}

/** Admin-editable Garden Service page content (settings.options.gardenServiceContent).
    Every field overlays the built-in copy per-value — blank keeps the built-in. */
export type GardenServiceContentConfig = {
  hero?: {
    image?: GiftingImage;
    headline?: string;
    subheadline?: string;
  };
  /** Up to 4 stat tiles in the band under the hero (per-index overlay). */
  stats?: Array<{ value?: string; label?: string }>;
  /** The 3 "How it works" steps (per-index overlay; icons stay built-in). */
  steps?: Array<{ title?: string; body?: string; image?: GiftingImage }>;
  /** The 4 "Everything's included" cards (per-index overlay; icons stay built-in). */
  features?: Array<{ title?: string; body?: string }>;
  /** Before/After photos + the 3-image strip under them (per-index overlay). */
  gallery?: {
    before?: GiftingImage;
    after?: GiftingImage;
    images?: Array<GiftingImage>;
  };
  /** When non-empty, replaces the built-in testimonial set. */
  testimonials?: Array<{ quote?: string; name?: string; city?: string }>;
  /** When non-empty, replaces the built-in FAQ set. */
  faq?: Array<{ q?: string; a?: string }>;
};

/** Garden Service page CMS block (mirrors useGiftingConfig). */
export function useGardenServiceContent(): GardenServiceContentConfig | null {
  const { settings } = useSettings() as any;
  return (settings?.gardenServiceContent ??
    null) as GardenServiceContentConfig | null;
}

/**
 * Admin-driven homepage config from settings.options (passthrough, no API change):
 * - banners: per-banner on/off flags (default ON when unset)
 * - homeCategories: ordered category slugs to feature on the home (null = all top-level)
 * - whyPlants / homeCollections: full section CMS (null = built-in defaults)
 * Settings are SSR-prefetched on the home, so this is stable on first paint (no flash).
 */
export function useHomeConfig() {
  const { settings } = useSettings() as any;
  return {
    banners: (settings?.homeBanners ?? {}) as Record<string, boolean>,
    homeCategories: (Array.isArray(settings?.homeCategories)
      ? (settings.homeCategories as string[])
      : null) as string[] | null,
    whyPlants: (settings?.whyPlants ?? null) as WhyPlantsConfig | null,
    homeCollections: (settings?.homeCollections ??
      null) as HomeCollectionsConfig | null,
    verticalsBand: (settings?.verticalsBand ??
      null) as VerticalsBandConfig | null,
    homeHero: (settings?.homeHero ?? null) as HomeHeroConfig | null,
  };
}

/** A single banner's on/off (default ON). */
export function useBannerEnabled(key: string): boolean {
  const { banners } = useHomeConfig();
  return banners?.[key] ?? true;
}

/**
 * Order/filter a fetched category list by the admin-curated slugs (homeCategories).
 * When no curation is set, return the input unchanged (all top-level).
 */
export function applyCuration<T extends { slug?: string }>(
  categories: T[],
  curated: string[] | null,
): T[] {
  if (!curated || curated.length === 0) return categories;
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const curatedList = curated.map((s) => bySlug.get(s)).filter(Boolean) as T[];
  // Stale/mismatched admin slugs (data drift, localized slugs) must never
  // blank the home grids — fall back to the uncurated list.
  return curatedList.length > 0 ? curatedList : categories;
}
