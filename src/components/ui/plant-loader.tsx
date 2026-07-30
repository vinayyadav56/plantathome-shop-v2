/**
 * The PlantAtHome loading marks.
 *
 * TWO TIERS, because one shape cannot do both jobs:
 *
 *   PlantLoader  — the leaf. Blocks, pages, modals, route transitions (>=32px).
 *   BrandSpinner — a ring. Buttons and input adornments (<=20px), where the
 *                  leaf's blades collapse into unreadable mush.
 *
 * Deliberately pure SVG + CSS keyframes — no Framer Motion, no Lottie. These
 * render inside loading boundaries, which are exactly the moments the JS bundle
 * has NOT finished arriving, so a loader that needs JS to animate is a loader
 * that does not animate when it matters.
 *
 * Colour is inherited via `currentColor`, so a call site inside a dark panel or
 * a coloured button gets a legible mark for free.
 *
 * Keyframes live in plantathome-overrides.css under `.pah-leaf-*` / `.pah-ring`
 * and collapse to a still, complete mark under prefers-reduced-motion.
 */

export type PlantLoaderSize = 'sm' | 'md' | 'lg';

const BOX: Record<PlantLoaderSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

export function PlantLoader({
  size = 'md',
  label,
  className = '',
  /**
   * Suppress the 150ms appear-delay. The delay exists so a fast response never
   * flashes a loader; turn it off only where the loader is the primary content
   * of a deliberately-blank screen (e.g. a full-page route gate).
   */
  immediate = false,
}: {
  size?: PlantLoaderSize;
  /** Announced to screen readers; also shown when provided. */
  label?: string;
  className?: string;
  immediate?: boolean;
}) {
  return (
    <div
      className={`pah-loader-appear${
        immediate ? ' pah-loader-appear--now' : ''
      } flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        viewBox="0 0 48 56"
        className={`${BOX[size]} overflow-visible text-forest-700`}
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/*
          The group carries the perpetual motion; the paths draw themselves ONCE.
          Splitting them is what stopped the mark erasing and redrawing on every
          cycle, which read as flicker rather than growth.
        */}
        <g className="pah-leaf-breathe">
          {/* stem — grows upward */}
          <path
            className="pah-leaf-stem"
            d="M24 54V22"
            pathLength={1}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* right leaf */}
          <path
            className="pah-leaf-blade pah-leaf-blade--r"
            d="M24 26c0-9 6.5-16.5 15-18 1 8.5-4.5 17-15 18z"
            pathLength={1}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          {/* left leaf, offset so the two unfurl in sequence */}
          <path
            className="pah-leaf-blade pah-leaf-blade--l"
            d="M24 34c0-8-6-15-13.5-16.5C9.6 25 14.5 33 24 34z"
            pathLength={1}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
        </g>
      </svg>

      {label ? (
        <p className="text-sm font-medium tracking-wide text-stone-600">
          {label}
        </p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

/**
 * The inline tier: a ring in the caller's own colour.
 *
 * Sized by className so a caller can keep whatever box it already reserved.
 * `currentColor` matters here — this sits inside buttons whose text is white on
 * forest, black on white, or accent on transparent, and a fixed brand green
 * would be invisible on at least one of them.
 */
export function BrandSpinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`pah-ring inline-block h-5 w-5 shrink-0 rounded-full border-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
    </span>
  );
}

export default PlantLoader;
