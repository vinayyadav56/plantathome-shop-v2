'use client';

import Link from 'next/link';
import cn from 'classnames';
import { ArrowRight } from '@/components/ui/icon';

/**
 * A /tools section's header row: serif H2 (pass `id` to label the section with
 * it) + an optional one-liner on the left, an optional "View All →" link on the
 * right. Spacing below the row is the caller's (`className`).
 *
 * Sizes are the mock's at lg (34 px H2, 19 px line); `small` is its lighter
 * guides/FAQ head (27 px from xl, 24 px at lg so "Gardening Tools — FAQs" fits
 * its one-third column on one line).
 */
export function SectionHead({
  id,
  title,
  sub,
  link,
  small,
  className,
}: {
  id?: string;
  title: string;
  sub?: string;
  link?: { label: string; href: string };
  small?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2
          id={id}
          className={cn(
            'font-[family-name:var(--font-plp-serif)] text-[26px] font-bold leading-tight text-forest-900',
            small ? 'lg:text-[24px] xl:text-[27px]' : 'sm:text-[30px] lg:text-[34px]',
          )}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[14px] text-stone-600 sm:text-[15px] lg:text-[19px]">{sub}</p>
        )}
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
