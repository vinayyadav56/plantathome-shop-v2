import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import { usePlantVoice } from '@/lib/use-plant-voice';
import { SVGLoaderIcon } from '@/components/icons/svg-loader';

interface Props {
  className?: string;
}

/**
 * Always-visible "search by voice" mic that lives inside the search bar.
 * Renders identical markup on server and client (support is checked on click),
 * so it appears in SSR HTML and never causes a hydration mismatch. On browsers
 * without the Web Speech API it stays visible and shows a friendly hint.
 *
 * The root has no `position` class so callers can place it (e.g. `absolute`);
 * the button itself is the positioning anchor for the popover.
 */
export const VoiceMic: React.FC<Props> = ({ className }) => {
  const { listening, processing, transcript, error, startListening } = usePlantVoice();
  const [popover, setPopover] = useState<string | null>(null);

  useEffect(() => {
    const msg = error || (transcript ? `“${transcript}”` : null);
    if (!msg) return;
    setPopover(msg);
    const timer = setTimeout(() => setPopover(null), 3000);
    return () => clearTimeout(timer);
  }, [error, transcript]);

  const isActive = listening || processing;
  const title = listening
    ? 'Listening…'
    : processing
    ? 'Finding plants…'
    : 'Search by voice';

  return (
    <span className={cn('inline-flex items-center', className)}>
      <button
        type="button"
        onClick={startListening}
        disabled={isActive}
        aria-label="Voice search"
        title={title}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-0',
          isActive
            ? 'animate-pulse bg-accent text-light'
            : 'text-body hover:bg-gray-100 hover:text-accent'
        )}
      >
        {processing ? (
          <SVGLoaderIcon className="h-5 w-5" />
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 18v3M8 21h8" />
          </svg>
        )}

        {popover && (
          <span className="absolute top-full z-50 mt-2 max-w-[220px] whitespace-normal rounded-md bg-gray-900 px-3 py-2 text-xs font-normal text-light shadow-lg ltr:right-0 rtl:left-0">
            {popover}
          </span>
        )}
      </button>
    </span>
  );
};

export default VoiceMic;
