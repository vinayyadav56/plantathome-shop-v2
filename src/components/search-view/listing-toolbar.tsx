'use client';

import { useEffect, useState } from 'react';
import Sorting from '@/components/search-view/sorting';

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

const GridGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[15px] w-[15px]">
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </svg>
);

const ListGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[15px] w-[15px]">
    <rect x="3" y="4" width="18" height="4" rx="1.5" />
    <rect x="3" y="10" width="18" height="4" rx="1.5" />
    <rect x="3" y="16" width="18" height="4" rx="1.5" />
  </svg>
);

type Props = {
  view: ListingView;
  onViewChange: (v: ListingView) => void;
  /** Products currently loaded; `hasMore` renders it as "24+". */
  count?: number;
  hasMore?: boolean;
};

/** Result count · sort · grid/list — the standard listing control bar. */
export default function ListingToolbar({ view, onViewChange, count, hasMore }: Props) {
  const views: { key: ListingView; label: string; Glyph: React.FC }[] = [
    { key: 'grid', label: 'Grid view', Glyph: GridGlyph },
    { key: 'list', label: 'List view', Glyph: ListGlyph },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-kraft-200 bg-white px-3 py-2.5 sm:px-4">
      {typeof count === 'number' && count > 0 ? (
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
        <div className="w-[190px] sm:w-[215px]">
          <Sorting variant="dropdown" />
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-kraft-200 p-0.5">
          {views.map(({ key, label, Glyph }) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewChange(key)}
              aria-label={label}
              aria-pressed={view === key}
              className={`grid h-8 w-8 place-items-center rounded-md transition ${
                view === key
                  ? 'bg-forest-50 text-forest-700'
                  : 'text-stone-400 hover:text-forest-700'
              }`}
            >
              <Glyph />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
