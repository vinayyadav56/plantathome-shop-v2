import type { Product } from '@/types';

/**
 * The plant "Features" facts shared by the grid cards — the listing card's
 * 2×3 icon grid and the compact card's inline rows both read from here.
 * Present-only: the catalogue is full of ''/None placeholders and those must
 * never become a rendered row.
 */

export type FeatureIcon = 'sun' | 'drop' | 'ruler' | 'home' | 'sprout' | 'paw';
export type PlantFeature = { key: string; title: string; label: string; icon: FeatureIcon };

const usableValue = (v: unknown): v is string =>
  typeof v === 'string' &&
  v.trim() !== '' &&
  !['none', 'null', 'n/a', 'na', '-'].includes(v.trim().toLowerCase());

/** Up to six present-only facts: Sunlight · Water · Height · Placement ·
 *  Growth · Pet-friendly. List rows carry plant_attribute (the API
 *  eager-loads it), so this costs no extra request. */
export function plantFeatures(product: Product): PlantFeature[] {
  const pa: any = (product as any).plant_attribute;
  if (!pa) return [];
  const out: PlantFeature[] = [];
  if (usableValue(pa.sunlight)) out.push({ key: 'sun', title: 'Sunlight', label: pa.sunlight.trim(), icon: 'sun' });
  if (usableValue(pa.water_requirement)) out.push({ key: 'water', title: 'Watering', label: `${pa.water_requirement.trim()} water`, icon: 'drop' });
  if (usableValue(pa.height_range)) out.push({ key: 'height', title: 'Height', label: pa.height_range.trim(), icon: 'ruler' });
  if (usableValue(pa.indoor_outdoor)) out.push({ key: 'place', title: 'Placement', label: pa.indoor_outdoor.trim(), icon: 'home' });
  if (usableValue(pa.growth_rate)) out.push({ key: 'growth', title: 'Growth', label: `${pa.growth_rate.trim()} growth`, icon: 'sprout' });
  if (pa.pet_friendly === true || pa.pet_friendly === false) {
    out.push({ key: 'pet', title: 'Pets', label: pa.pet_friendly ? 'Pet friendly' : 'Not pet safe', icon: 'paw' });
  }
  return out.slice(0, 6);
}

const FEATURE_PATHS: Record<FeatureIcon, string> = {
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  drop: 'M12 3s6 6.35 6 10.5a6 6 0 0 1-12 0C6 9.35 12 3 12 3Z',
  ruler: 'M12 3v18M9 5h3m-3 4h3m-3 4h3m-3 4h3',
  home: 'M3 11.5 12 4l9 7.5M5.5 9.8V20h13V9.8',
  sprout: 'M12 20v-6m0 0c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6Zm0 0c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z',
  paw: 'M8 9.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Zm8 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM4.8 13.3a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Zm14.4 0a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM12 12c-2.6 0-4.8 2-4.8 4.2 0 1.2 1 2 2.2 1.8.9-.1 1.7-.4 2.6-.4s1.7.3 2.6.4c1.2.2 2.2-.6 2.2-1.8C16.8 14 14.6 12 12 12Z',
};

export const FeatureGlyph = ({ name, className = 'h-[15px] w-[15px]' }: { name: FeatureIcon; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#7FA779"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={`${className} shrink-0`}
  >
    <path d={FEATURE_PATHS[name]} />
  </svg>
);
