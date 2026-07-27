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
    <div className="fixed inset-x-0 bottom-14 z-30 border-t border-[#ECECEC] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.45)] backdrop-blur md:bottom-0 lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-[#184A31]">
            {name}
          </p>
          <p className="text-[17px] font-bold leading-tight text-[#14532D]">
            {priceText}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className={classNames(
            'flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[14px] px-6 py-2.5 text-sm font-semibold transition',
            disabled
              ? 'cursor-not-allowed bg-stone-300 text-stone-500'
              : 'bg-[#14532D] text-white hover:bg-[#0D4324]',
          )}
        >
          <LineIcon name="cart" className="h-[18px] w-[18px]" />
          {label}
        </button>
      </div>
    </div>
  );
}

export default StickyAtcBar;
