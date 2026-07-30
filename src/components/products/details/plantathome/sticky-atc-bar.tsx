'use client';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { LineIcon } from '@/components/icons/line-icons';

/**
 * Mobile sticky Add-to-Cart bar that appears only once the inline CTA
 * (the sentinel) has scrolled ABOVE the viewport — so it never doubles up
 * with the visible inline button. SSR-safe: `visible` starts false, so the
 * server and first client paint both render null; the IntersectionObserver
 * only flips it after hydration.
 */
export function StickyAtcBar({
  sentinel,
  name,
  priceText,
  disabled,
  label,
  onAdd,
}: {
  sentinel: React.RefObject<HTMLElement | null>;
  name: string;
  priceText: string;
  disabled: boolean;
  label: string;
  onAdd: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      // Show only when the sentinel is above the viewport (scrolled past),
      // not when it's below the fold on initial load.
      setVisible(entry.boundingClientRect.top < 0 && !entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinel]);

  if (!visible) return null;

  return (
    // `lg:hidden` removed: the bar now follows on every width. On a long PDP the
    // inline CTA scrolls away on desktop too, and once it has there was nothing
    // to buy with without scrolling back up.
    //
    // Sizes step up rather than being fixed — at 360px the 15px price and a
    // `px-6` button pushed the name to a couple of ellipsised characters.
    <div className="fixed inset-x-0 bottom-14 z-30 border-t border-[#ECECEC] bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.45)] backdrop-blur sm:px-4 sm:py-3 md:bottom-0">
      <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-3 lg:max-w-5xl">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-tight text-[#184A31] sm:text-[13px]">
            {name}
          </p>
          {/* whitespace-nowrap: a price RANGE ("₹359.00 – ₹929.00") wrapped to
              two lines on narrow screens and shoved the bar taller. */}
          <p className="truncate whitespace-nowrap text-[13.5px] font-bold leading-tight text-[#14532D] sm:text-[15px]">
            {priceText}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className={classNames(
            'flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[14px] px-4 py-2 text-[13px] font-semibold transition sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm',
            disabled
              ? 'cursor-not-allowed bg-stone-300 text-stone-500'
              : 'bg-[#14532D] text-white hover:bg-[#0D4324]',
          )}
        >
          <LineIcon name="cart" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          <span className="truncate">{label}</span>
        </button>
      </div>
    </div>
  );
}

export default StickyAtcBar;
