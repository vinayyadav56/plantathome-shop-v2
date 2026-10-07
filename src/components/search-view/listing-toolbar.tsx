'use client';

import { useEffect, useState } from 'react';
import cn from 'classnames';
import Sorting from '@/components/search-view/sorting';
import {
  LayoutGrid,
  ListView,
} from '@/components/ui/icon';

export type ListingView = 'grid' | 'list';

const STORAGE_KEY = 'pah_listing_view';

/**
 * Grid/list preference, remembered across visits.
 *
 * Deliberately NOT in the URL query: listing pages spread their whole query
 * straight into useProducts(), so a `?view=list` param would be forwarded to
 * the products API as if it were a filter.
 */
export function useListingView() {
  const [view, setView] = useState<ListingView>('grid');

  // Read AFTER mount, never during render: localStorage doesn't exist on the
  // server, so seeding state from it makes the SSR HTML and the first client
  // render disagree and React throws the tree away (the #418 class of bug).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'list' || saved === 'grid') setView(saved);
    } catch {
      /* Safari private mode throws on access — the grid default is fine. */
    }
  }, []);

  const change = (next: ListingView) => {
    setView(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* preference just won't persist */
    }
  };

  return [view, change] as const;
}

const GridGlyph = () => <LayoutGrid size={14} fill="currentColor" aria-hidden />;

/* No rows/list glyph in the approved icon set — keep the hand-rolled bars. */
const ListGlyph = () => (
  <ListView size={16} aria-hidden />
);

type Props = {
  view: ListingView;
  onViewChange: (v: ListingView) => void;
  /** Products currently loaded; `hasMore` renders it as "24+". */
  count?: number;
  hasMore?: boolean;
  /**
   * `card` (default) — the bordered white bar /c and search use today.
   * `plain` — no chrome, no background of its own: the PLP results row, set
   * for the page's soft-sage strip (sage-100, painted by its sticky wrapper):
   * "Sort by" label + white 150px sort + 36px toggles on a white/70 pill.
   */
  variant?: 'card' | 'plain';
  /**
   * Replaces the "{n} plants" count span. In `plain` it is set at the mock's
   * results-row size (18 → 22px, forest-900), so the PLP passes
   * `<><strong>{total}</strong> Plants available in {city}</>` and nothing else;
   * in `card` it inherits the 13px count look. Always wrapped, so a fragment
   * stays one flex item.
   */
  countLabel?: React.ReactNode;
  /** Sort shown when the URL has no `orderBy` (the PLP passes 'sold_quantity' = Popular). */
  sortDefaultOrderBy?: string;
  /** 36px compact sort control. */
  sortCompact?: boolean;
};

/** Result count · sort · grid/list — the standard listing control bar. */
export default function ListingToolbar({
  view,
  onViewChange,
  count,
  hasMore,
  variant = 'card',
  countLabel,
  sortDefaultOrderBy,
  sortCompact,
}: Props) {
  const plain = variant === 'plain';
  const views: { key: ListingView; label: string; Glyph: React.FC }[] = [
    { key: 'grid', label: 'Grid view', Glyph: GridGlyph },
    { key: 'list', label: 'List view', Glyph: ListGlyph },
  ];

  return (
    <div
      className={
        plain
          ? 'flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-2.5'
          : 'shadow-box mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-kraft-200 bg-white px-3 py-2.5 sm:px-4'
      }
    >
      {countLabel != null ? (
        <div
          className={
            plain
              ? 'min-w-0 text-[18px] text-forest-900 md:text-[20px] lg:text-[22px]'
              : 'font-hanken text-[13px] text-stone-500'
          }
        >
          {countLabel}
        </div>
      ) : typeof count === 'number' && count > 0 ? (
        <span className="font-hanken text-[13px] text-stone-500">
          <strong className="font-medium text-forest-900">
            {count}
            {hasMore ? '+' : ''}
          </strong>{' '}
          plant{count === 1 && !hasMore ? '' : 's'}
        </span>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {plain && <span className="text-[14px] text-forest-800/80">Sort by</span>}
        {/* Plain: white from the server HTML on — Select paints a blank placeholder
            until mount, which would otherwise pop from sage to white. */}
        <div className={plain ? 'w-[150px] rounded-lg bg-white' : 'w-[190px] sm:w-[215px]'}>
          <Sorting variant="dropdown" defaultOrderBy={sortDefaultOrderBy} compact={sortCompact} />
        </div>

        <div
          className={cn(
            'flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5',
            plain ? 'border-sage-200 bg-white/70' : 'border-kraft-200',
          )}
        >
          {views.map(({ key, label, Glyph }) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewChange(key)}
              aria-label={label}
              aria-pressed={view === key}
              className={cn(
                'grid place-items-center rounded-md transition',
                plain ? 'h-9 w-9' : 'h-8 w-8',
                view === key
                  ? plain
                    ? 'bg-forest-900 text-white'
                    : 'bg-forest-50 text-forest-700'
                  : plain
                    ? 'text-forest-800/60 hover:text-forest-900'
                    : 'text-stone-400 hover:text-forest-700',
              )}
            >
              <Glyph />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
