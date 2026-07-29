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

/** Quick-glance plant facts (pet / air / light / water / placement), in the
 *  order a plant shopper cares about. Only REAL plant_attribute values are
 *  returned — nothing is invented, so a product with no attributes yields [].
 *
 *  Shared by the PDP's chip row and the product card, which previously each
 *  had their own copy of this list. */
export function plantQuickFacts(product: Product): { icon: string; label: string }[] {
  const pa = (product as any)?.plant_attribute;
  if (!pa) return [];
  const facts: { icon: string; label: string }[] = [];
  const head = (v: unknown) => String(v).split(/[,/]/)[0].trim();
  if (pa.pet_friendly != null)
    facts.push({ icon: 'shield', label: pa.pet_friendly ? 'Pet friendly' : 'Keep from pets' });
  if (pa.air_purifying) facts.push({ icon: 'leaf', label: 'Air purifying' });
  if (pa.sunlight) facts.push({ icon: 'lotus', label: head(pa.sunlight) });
  if (pa.water_requirement) facts.push({ icon: 'droplet', label: `${head(pa.water_requirement)} water` });
  if (pa.indoor_outdoor) facts.push({ icon: 'box', label: pa.indoor_outdoor });
  return facts;
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
export function shortDescription(product: Product): string {
  const preview = (product as any)?.description_preview;
  if (preview && String(preview).trim()) return String(preview).trim();
  const plain = stripHtml((product as any)?.description);
  if (plain) return plain;
  const a = product?.plant_attribute;
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
