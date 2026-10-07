'use client';

import Link from 'next/link';
import cn from 'classnames';
import { ArrowRight } from '@/components/ui/icon';

/**
 * A /tools section's header row: serif H2 (pass `id` to label the section with
 * it) + an optional one-liner on the left, an optional "View All →" link on the
 * right. Spacing below the row is the caller's (`className`).
 */
export function SectionHead({
  id,
  title,
  sub,
  link,
  className,
}: {
  id?: string;
  title: string;
  sub?: string;
  link?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2
          id={id}
          className="font-[family-name:var(--font-plp-serif)] text-[26px] font-bold leading-tight text-forest-900 sm:text-[30px]"
        >
          {title}
        </h2>
        {sub && <p className="mt-1.5 text-[14px] text-stone-600 sm:text-[15px]">{sub}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-forest-700 hover:text-forest-900"
        >
          {link.label}
          <ArrowRight size={14} aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default SectionHead;
