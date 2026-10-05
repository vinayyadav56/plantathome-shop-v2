import type { Product, Tag } from '@/types';

/**
 * Shared product-card helpers — badges + short-description copy used by the
 * canonical card (cards/plantathome.tsx) and both compact home-rail cards, so
 * every card surface labels products identically.
 */

/** Tag slug/name → display label. Checked in PRIORITY order (a product tagged
 *  both "trending" and "bestseller" shows "Bestseller"). */
const BADGE_PRIORITY: { match: RegExp; label: string }[] = [
  { match: /^best.?seller$|^best seller$/, label: 'Bestseller' },
  { match: /^new.?arrival$/, label: 'New Arrival' },
  { match: /^popular$/, label: 'Popular' },
  { match: /^trending$|^trend$/, label: 'Trending' },
  { match: /^editors?.?s?.?pick$|^editor's pick$/, label: "Editor's Pick" },
  { match: /^air.?purifier$/, label: 'Air Purifier' },
];

export function getBadge(tags: Tag[] = []): string | null {
  const keys = tags.flatMap((t) =>
    [t.slug, t.name].filter(Boolean).map((s) => String(s).trim().toLowerCase()),
  );
  for (const { match, label } of BADGE_PRIORITY) {
    if (keys.some((k) => match.test(k))) return label;
  }
  return null;
}

/** Badge including the flash-sale fallback (the discount % is NOT a badge —
 *  it lives in the price row). */
export function getCardBadge(product: Product): string | null {
  const tagBadge = getBadge(product?.tags);
  if (tagBadge) return tagBadge;
  if ((product as any)?.in_flash_sale) return 'Flash Deal';
  return null;
}

export type PlantFact = {
  key: string;
  /** LineIcon name */
  icon: string;
  /** Spec-grid heading ("Light") and its value ("Bright Indirect"). */
  label: string;
  value: string;
  /** The same fact as one self-explanatory phrase, for chip rows. */
  chip: string;
};

/** Every REAL plant_attribute fact, in the order a shopper scans them: light,
 *  water, placement, pets, air — then the secondary ones. Nothing is invented,
 *  so a product with no attributes yields [].
 *
 *  The single source for plant facts: the card's chips, the list view's spec
 *  grid and the PDP's chip row all read this list. */
export function plantFactRows(product: Product): PlantFact[] {
  const pa = (product as any)?.plant_attribute;
  if (!pa) return [];
  const head = (v: unknown) => String(v).split(/[,/]/)[0].trim();
  // 'None' is how the catalogue import spells "no value" for some columns.
  const has = (v: unknown) => v != null && !['', 'none'].includes(String(v).trim().toLowerCase());
  const rows: PlantFact[] = [];
  if (has(pa.sunlight)) {
    const v = head(pa.sunlight);
    rows.push({ key: 'light', icon: 'lotus', label: 'Light', value: v, chip: v });
  }
  if (has(pa.water_requirement)) {
    const v = head(pa.water_requirement);
    rows.push({ key: 'water', icon: 'droplet', label: 'Water', value: v, chip: `${v} water` });
  }
  if (has(pa.indoor_outdoor)) {
    const v = String(pa.indoor_outdoor).trim();
    rows.push({ key: 'placement', icon: 'box', label: 'Placement', value: v, chip: v });
  }
  if (pa.pet_friendly != null)
    rows.push({
      key: 'pets',
      icon: 'shield',
      label: 'Pets',
      value: pa.pet_friendly ? 'Pet friendly' : 'Keep away',
      chip: pa.pet_friendly ? 'Pet friendly' : 'Keep from pets',
    });
  if (pa.air_purifying)
    rows.push({ key: 'air', icon: 'leaf', label: 'Air', value: 'Air purifying', chip: 'Air purifying' });
  // Secondary facts — fill in when the primary five are sparse so a plant
  // with any attribute data at all still gets something on its card.
  if (has(pa.difficulty_level)) {
    const v = head(pa.difficulty_level);
    rows.push({ key: 'care', icon: 'sprout', label: 'Care', value: v, chip: `${v} care` });
  }
  if (has(pa.growth_rate)) {
    const v = head(pa.growth_rate);
    rows.push({ key: 'growth', icon: 'plant', label: 'Growth', value: v, chip: `${v} growth` });
  }
  if (has(pa.humidity)) {
    const v = head(pa.humidity);
    rows.push({ key: 'humidity', icon: 'humidity', label: 'Humidity', value: v, chip: `${v} humidity` });
  }
  if (has(pa.height_range)) {
    const v = head(pa.height_range);
    rows.push({ key: 'height', icon: 'prune', label: 'Height', value: v, chip: v });
  }
  return rows;
}

/** Quick-glance chips ({icon, label}) — plantFactRows as one-phrase labels.
 *  Shared by the PDP's chip row and the product card. */
export function plantQuickFacts(product: Product): { icon: string; label: string }[] {
  return plantFactRows(product).map(({ icon, chip }) => ({ icon, label: chip }));
}

/** Quill descriptions are HTML — flatten to plain text for the 2-line clamp. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** One/two-line supporting copy: real description first, then a synthesized
 *  line from plant attributes, then the category. Never throws, may be ''.
 *  List payloads omit the full HTML description but carry the server-built
 *  `description_preview` — prefer it so cards always match the admin copy. */
export function shortDescription(product: Product, synthesize = true): string {
  const preview = (product as any)?.description_preview;
  if (preview && String(preview).trim()) return String(preview).trim();
  const plain = stripHtml((product as any)?.description);
  if (plain) return plain;
  // `synthesize: false` is for surfaces that already show the plant facts as
  // chips/specs — there this line would just repeat them one row higher.
  const a = synthesize ? product?.plant_attribute : null;
  if (a) {
    const bits: string[] = [];
    if (a.sunlight) bits.push(String(a.sunlight).split(/[,/]/)[0].trim());
    if ((a as any).air_purifying) bits.push('Air purifying');
    else if (a.water_requirement)
      bits.push(`${String(a.water_requirement).split(/[,/]/)[0].trim()} water`);
    else if ((a as any).pet_friendly) bits.push('Pet friendly');
    const s = bits.slice(0, 2).join(' · ');
    if (s) return s;
  }
  return product?.categories?.[0]?.name || (product as any)?.unit || '';
}

/** Drop a whole-rupee ".00" from a formatted price.
 *
 *  Product cards are narrow — at two-up mobile the big card's price row has
 *  ~140px and the mini card's price column ~65px — and those four characters
 *  are the difference between the price, the struck price and the discount chip
 *  sharing one line or overflowing into the button beside them.
 *
 *  Real paise are preserved (₹1,299.50 stays intact), so a price is never
 *  misstated; only a trailing ".00" goes. Indian formatting groups with commas,
 *  so a "." only ever introduces decimals here. */
export function compactPrice(s?: string): string | undefined {
  return s ? s.replace(/\.00(?=\D|$)/g, '') : s;
}

/** Props that make a product-card link open the PDP in a NEW tab, leaving the
 *  grid the customer was browsing exactly where it was — no navigation, no
 *  scroll position to restore on Back.
 *
 *  `rel` is not decoration: without `noopener` the opened page can reach back
 *  through `window.opener` and redirect the tab it came from (reverse
 *  tabnabbing). Browsers imply it for `target="_blank"` now, but this is a
 *  security property worth stating rather than inheriting.
 *
 *  One constant instead of ten copies, so "new tab" vs "same tab" is a
 *  one-line decision for the whole storefront. */
export const PRODUCT_LINK_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
