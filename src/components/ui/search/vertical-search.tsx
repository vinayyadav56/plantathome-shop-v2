'use client';
import Search from '@/components/ui/search/search';
import { getVerticalMeta } from '@/components/storefront/verticals';

/**
 * A vertical's own search box (owner annotation 2026-10-12 on /plants' "Shop by Need" row:
 * "provide search box in this row in right corner, and for each vertical"). Enter goes to
 * /{type}/search?text=…, that vertical's results; there the box holds the term, to refine it.
 * No voice mic: voice search always lands on /plants/search.
 */
export default function VerticalSearch({ type, className }: { type: string; className?: string }) {
  const label = `Search ${getVerticalMeta(type).label}`;
  return (
    <Search
      label={`${type}-search`}
      aria-label={label}
      placeholder={label}
      variant="minimal"
      searchType={type}
      voice={false}
      className={className}
      // 16px below md: iPhone Safari zooms into a smaller field on focus. Important, because
      // SearchBox's own text-sm comes later in the stylesheet and would win.
      inputClassName="!text-base md:!text-sm"
    />
  );
}
