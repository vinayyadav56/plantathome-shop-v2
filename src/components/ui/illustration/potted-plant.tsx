/**
 * The empty/not-found mark. ONE copy -- this drawing used to be pasted into
 * three files (404, not-found, empty-products) and had already drifted apart:
 * different leaf paths, swapped fills, and a different draw order that put the
 * pot behind the foliage in one of them.
 *
 * Illustrations are not icons: this sits above the 24 grid and is deliberately
 * multi-tone. Every colour is a Tailwind ramp value (olive, sage, forest,
 * kraft) -- no gradients, no off-palette greens.
 */
export default function PottedPlantIllustration({
  className = 'h-24 w-24 sm:h-28 sm:w-28',
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden focusable="false">
      {/* foliage, back to front */}
      <path d="M60 70c0-16-8-26-22-30 0 15 7 25 22 30Z" fill="#6E8B4A" />
      <path d="M60 70c0-20 9-32 26-36 0 18-9 30-26 36Z" fill="#4E8B31" />
      <path d="M60 70c0-12-2-24 0-36 4 10 5 24 0 36Z" fill="#8FAE80" />
      <path d="M60 36v34" stroke="#2E5E2A" strokeWidth="2" strokeLinecap="round" />
      {/* pot in front, so the stem reads as planted rather than floating */}
      <rect x="33" y="68" width="54" height="10" rx="3" fill="#D7C9AE" stroke="#C9B79A" strokeWidth="2" />
      <path d="M36 74h48l-5 28a6 6 0 0 1-6 5H47a6 6 0 0 1-6-5L36 74Z" fill="#E9E3D6" stroke="#C9B79A" strokeWidth="2" />
    </svg>
  );
}
