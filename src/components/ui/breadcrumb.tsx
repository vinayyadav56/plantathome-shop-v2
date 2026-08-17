import Link from '@/components/ui/link';
import { ChevronRight } from 'lucide-react';
import cn from 'classnames';

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * THE breadcrumb. There used to be four unrelated implementations — the PDP's inline nav, the
 * page banner's <ul>, the tracking hero's hardcoded trail, and a misnamed category filter-pill —
 * with three font sizes, three separators and three link colors between them, plus a
 * `.pa-breadcrumb` CSS class that encoded the intended design and was never wired to anything.
 * This component IS that design; everything renders through it now.
 *
 * Rules the call sites follow:
 *   - never a dead link: a crumb whose target is unknown is OMITTED, not pointed at `/`;
 *   - the terminal crumb is the current page (no href, aria-current);
 *   - trails are built per page from data the page already has — this only renders.
 */
export default function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  const crumbs = items.filter((c) => c && c.label);
  if (crumbs.length < 2) return null; // "Home" alone is not a trail

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 overflow-hidden text-[13px] leading-none">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li
              key={`${c.label}-${i}`}
              className={cn('flex min-w-0 items-center gap-1.5', last && 'min-w-0 flex-shrink')}
            >
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="whitespace-nowrap text-forest-800/80 transition-colors hover:text-forest-900"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn(
                    'truncate',
                    last ? 'font-medium text-forest-900' : 'whitespace-nowrap text-forest-800/80',
                  )}
                >
                  {c.label}
                </span>
              )}
              {!last && (
                <ChevronRight size={14} aria-hidden className="shrink-0 text-forest-800/40" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
