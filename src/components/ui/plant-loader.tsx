/**
 * The brand loading mark: a leaf that draws itself, then a stem that grows.
 *
 * Deliberately pure SVG + CSS keyframes — no Lottie, no runtime animation
 * library. It renders inside Suspense/loading boundaries, which are exactly the
 * moments the JS bundle has not finished arriving, so a loader that needs JS to
 * animate is a loader that does not animate when it matters.
 *
 * Colour comes from `currentColor` so it inherits the brand token at the call
 * site instead of hardcoding a green. Keyframes live in
 * plantathome-overrides.css under `.pah-leaf-*` and are disabled under
 * prefers-reduced-motion, where the mark simply renders complete and still.
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
}: {
  size?: PlantLoaderSize;
  /** Announced to screen readers; also shown when provided. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-forest-700 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        viewBox="0 0 48 56"
        className={`${BOX[size]} overflow-visible`}
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {/* stem — grows upward */}
        <path
          className="pah-leaf-stem"
          d="M24 54V22"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* right leaf */}
        <path
          className="pah-leaf-blade pah-leaf-blade--r"
          d="M24 26c0-9 6.5-16.5 15-18 1 8.5-4.5 17-15 18z"
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
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.12"
        />
      </svg>

      {label ? (
        <p className="text-sm font-medium tracking-wide text-stone-600">{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

export default PlantLoader;
