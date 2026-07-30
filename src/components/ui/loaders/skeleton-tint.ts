/**
 * The one place the skeleton shimmer colours are defined.
 *
 * Every react-content-loader skeleton used to carry its own literal grey pair
 * (`#e0e0e0`/`#cecece` in some files, `#f3f3f3`/`#ecebeb` in others, `#F1F2F4`
 * in a third) — eleven copies, three shades, none of them brand. Re-tinting
 * meant editing eleven files and inevitably missing one.
 *
 * These are deliberately LOW-contrast: a skeleton is a hint about the shape of
 * what is coming, not a thing to look at. Pushing it to full brand green would
 * make every loading grid shout.
 *
 * Values are the storefront's own tokens — mintsoft (#F4F1EA) as the resting
 * surface and mint (#E7EEE2) as the travelling highlight — kept as literals
 * because react-content-loader writes them into an SVG gradient, where a
 * Tailwind class cannot reach.
 */
export const SKELETON_BG = '#F4F1EA';
export const SKELETON_FG = '#E7EEE2';

/** Spread into a <ContentLoader> so no call site repeats the pair. */
export const skeletonTint = {
  backgroundColor: SKELETON_BG,
  foregroundColor: SKELETON_FG,
} as const;
