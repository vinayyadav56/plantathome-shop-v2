/**
 * Site-wide text size (owner pick 2026-10-11 from the colour preview board: "Comfortable", 106%).
 *
 * Most sizes here are fixed classes (text-[13px], text-sm, clamp(..cqw..)), so raising the root
 * font-size would also grow every rem-based margin and padding. Instead, every ABSOLUTE
 * font-size / line-height in the compiled CSS becomes calc(<value> * var(--fs-scale, 1)), and
 * --fs-scale is set once in plantathome-overrides.css :root. Relative values (em, %, keywords,
 * unitless line-heights) are left alone: they follow their already-scaled parent, so nothing
 * compounds. Sizes set inline in JSX are not covered (there is one, the review-form stars).
 */
const ABSOLUTE = /\d(?:px|rem)\b|\b(?:clamp|min|max|calc)\(/i;
const RELATIVE = /(?:^|[^r])em\b|%|\b(?:inherit|initial|unset|revert|normal|smaller|larger)\b/i;

module.exports = () => ({
  postcssPlugin: 'pah-font-scale',
  Declaration(decl) {
    if (decl.prop !== 'font-size' && decl.prop !== 'line-height') return;
    const value = decl.value;
    if (value.includes('--fs-scale') || !ABSOLUTE.test(value) || RELATIVE.test(value)) return;
    decl.value = `calc(${value} * var(--fs-scale, 1))`;
  },
});
module.exports.postcss = true;
