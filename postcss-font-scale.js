/**
 * Site-wide text size: 106% (owner pick 2026-10-11) minus 2px (owner 2026-10-14: "font size
 * 2px less overall, across the whole website"), never below 9px and never larger than today.
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
    if (value.includes('--fs-scale') || value.includes('--fs-offset') || !ABSOLUTE.test(value) || RELATIVE.test(value)) return;
    const scaled = `${value} * var(--fs-scale, 1)`;
    // A flat multiplier would take 7px off a headline and 1.7px off a label; the owner asked for
    // 2px everywhere. The floor keeps the 9px card chips readable, and min() keeps anything that
    // was already smaller than 9px (hero micro-labels) exactly where it is.
    decl.value = decl.prop === 'font-size'
      ? `max(min(9px, ${scaled}), calc(${scaled} - var(--fs-offset, 0px)))`
      : `calc(${scaled} - var(--fs-offset, 0px))`;
  },
});
module.exports.postcss = true;
