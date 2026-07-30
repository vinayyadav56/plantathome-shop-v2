import { BrandSpinner, PlantLoader } from '@/components/ui/plant-loader';
import cn from 'classnames';

/**
 * Compatibility shim over the brand loading marks.
 *
 * This file used to BE the Pickbazar spinner — a teal ring hardcoded to
 * #009F7F in a CSS module, ignoring the brand token entirely. It is imported by
 * 27 call sites, so rather than edit all of them (and miss some), the exports
 * and prop signatures are preserved EXACTLY and only the rendering changed.
 * Every existing `<Spinner />` and `<SpinnerLoader />` is now the brand mark.
 *
 * Prefer importing PlantLoader / BrandSpinner directly in new code; this shim
 * exists for the installed base, not as the recommended API.
 *
 * Tier selection is automatic:
 *   simple, or a className that pins a box under ~24px  -> BrandSpinner (ring)
 *   everything else                                     -> PlantLoader (leaf)
 * because a leaf rendered at 16px is unreadable mush, and a ring blown up to
 * fill a page is exactly the un-branded look this change exists to remove.
 */

interface Props {
  className?: string;
  text?: string;
  showText?: boolean;
  simple?: boolean;
}

/**
 * True when a className pins the box to something too small for the leaf.
 *
 * Call sites express their size in Tailwind (`h-6 w-6`, `!h-8`), so the size is
 * only knowable from the class string. Anything h-6 (24px) or below gets the
 * ring; h-7+ and unsized (which means "fill the container") get the leaf.
 */
function isInlineSize(className?: string): boolean {
  if (!className) return false;
  const m = className.match(/!?h-(\d+)/);
  if (!m) return false;
  return Number(m[1]) <= 6;
}

const Spinner = ({ className, showText = true, text = 'Loading', simple }: Props) => {
  if (simple || isInlineSize(className)) {
    return <BrandSpinner className={className} />;
  }

  return (
    <span
      className={cn(
        'flex h-screen w-full flex-col items-center justify-center',
        className
      )}
    >
      {/* immediate: these are full-height gates — the screen is already blank,
          so delaying the mark would just show emptier emptiness. */}
      <PlantLoader size="lg" immediate label={showText ? text : undefined} />
    </span>
  );
};

interface SpinnerPops {
  className?: string;
}

export const SpinnerLoader = ({ className }: SpinnerPops) => (
  <BrandSpinner className={className} />
);

export default Spinner;
