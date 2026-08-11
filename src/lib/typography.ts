/**
 * Website fonts — admin-switchable via `settings.options.typography`
 * (fontFamily = body axis, headingFontFamily = heading axis).
 *
 * PRECEDENCE (the fix for "Design System fonts never apply"): this applier runs
 * AFTER the design-system applier, but an axis only wins when the admin has
 * EXPLICITLY configured it. An unset axis (null/undefined) DEFERS — the
 * design-system font pairing's value stays. The old behavior treated "unset"
 * as "force the default" (Inter body / Cormorant headings), which silently
 * clobbered every Design System font pairing on every load. The rem type scale
 * (--h1..--h6 / --fs-*) is untouched either way.
 */

export const TYPO_STORAGE_KEY = 'pah-font-family';
export const DEFAULT_FONT = 'Inter';
export const DEFAULT_HEADING_FONT = 'Cormorant Garamond';

/** Weights requested from Google Fonts for whichever family is selected. */
const FONT_WEIGHTS = 'wght@300;400;500;600;700;800';

/** Shared sans-serif fallback stack appended after the chosen family. */
const FALLBACK =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Curated families the admin can pick (must match the admin FONT_FAMILIES list).
 *  "System" = no web font, uses the OS default sans stack. */
export const FONT_FAMILIES: { value: string; name: string }[] = [
  { value: 'Inter', name: 'Inter (default)' },
  { value: 'Manrope', name: 'Manrope' },
  { value: 'Poppins', name: 'Poppins' },
  { value: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans' },
  { value: 'Roboto', name: 'Roboto' },
  { value: 'Open Sans', name: 'Open Sans' },
  { value: 'Lato', name: 'Lato' },
  { value: 'Montserrat', name: 'Montserrat' },
  { value: 'Nunito Sans', name: 'Nunito Sans' },
  { value: 'Work Sans', name: 'Work Sans' },
  { value: 'System', name: 'System (no web font)' },
];

const isSystem = (family: string) => !family || family.trim().toLowerCase() === 'system';

/** Serif fallback used behind the heading (display) family. */
const SERIF_FALLBACK = "Georgia, 'Times New Roman', Times, serif";

/** Curated HEADING families the admin can pick (must match the admin list).
 *  The '' sentinel means "same as the body font" — no serif, one face sitewide. */
export const HEADING_FONT_FAMILIES: { value: string; name: string }[] = [
  { value: 'Cormorant Garamond', name: 'Cormorant Garamond (default)' },
  { value: 'Playfair Display', name: 'Playfair Display' },
  { value: 'Lora', name: 'Lora' },
  { value: 'Merriweather', name: 'Merriweather' },
  { value: '', name: 'Same as body font' },
];

/** css2 REJECTS weight lists a family does not ship (whole request 400s and the
 *  font silently falls back), so heading families carry per-family weights. */
const HEADING_WEIGHTS: Record<string, string> = {
  'Playfair Display': 'wght@400;500;600;700;800',
  'Cormorant Garamond': 'wght@400;500;600;700',
  Lora: 'wght@400;500;600;700',
  Merriweather: 'wght@300;400;700;900',
};

/** Google Fonts stylesheet URL for a heading family (null for the body-font sentinel). */
export function headingFontCssUrl(family: string | null | undefined): string | null {
  const fam = (family ?? '').trim();
  if (!fam) return null;
  const weights = HEADING_WEIGHTS[fam] ?? 'wght@400;700';
  return `https://fonts.googleapis.com/css2?family=${fam.replace(/\s+/g, '+')}:${weights}&display=swap`;
}

/** CSS font-family value for a heading family (null = use the body stack). */
export function headingFontStack(family: string | null | undefined): string | null {
  const fam = (family ?? '').trim();
  if (!fam) return null;
  const quoted = /\s/.test(fam) ? `'${fam}'` : fam;
  return `${quoted}, ${SERIF_FALLBACK}`;
}

/** Google Fonts stylesheet URL for a family (null for the System stack).
 *  Inter also gets 900 for the few `font-black` display stats; most other
 *  curated families stop at 800 and css2 rejects URLs asking for weights a
 *  family does not ship. */
export function fontCssUrl(family: string): string | null {
  if (isSystem(family)) return null;
  const fam = family.trim();
  const weights = fam === 'Inter' ? `${FONT_WEIGHTS};900` : FONT_WEIGHTS;
  return `https://fonts.googleapis.com/css2?family=${fam.replace(/\s+/g, '+')}:${weights}&display=swap`;
}

/** Full CSS font-family value for a family (quoted if multi-word) + fallback. */
export function fontStack(family: string): string {
  if (isSystem(family)) return FALLBACK;
  const f = family.trim();
  const quoted = /\s/.test(f) ? `'${f}'` : f;
  return `${quoted}, ${FALLBACK}`;
}

const linkId = (family: string) => 'pah-font-' + (family || 'system').trim().toLowerCase().replace(/\s+/g, '-');

/** Inject the Google Fonts <link> for a family once (browser only). If the
 *  prepaint already injected this family from a stale persisted URL (e.g. an
 *  old weight list), repoint it instead of skipping. Pass `hrefOverride` for
 *  families whose URL is not built by fontCssUrl (heading serifs). */
export function ensureFontLoaded(family: string, hrefOverride?: string | null): void {
  if (typeof document === 'undefined') return;
  const href = hrefOverride ?? fontCssUrl(family);
  if (!href) return;
  const id = linkId(family);
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  if (existing) {
    if (existing.href !== href) existing.href = href;
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Apply the website fonts via CSS vars + persist for the next load's
 *  pre-paint script. Browser only. Two INDEPENDENT axes:
 *  - body family → --font-body / --font-sans / --font-eyebrow
 *  - heading family → --font-heading ('' = "Same as body": collapses headings
 *    onto the body stack via var(--font-body), so it follows whatever body
 *    resolves to — typography's or the design system's)
 *  An axis that is null/undefined is NOT CONFIGURED and must DEFER to the
 *  design-system font pairing (applied just before this) — never overwrite it
 *  with a default. Explicit values (a family name, or '' for headings) win. */
export function applyTypography(
  family: string | undefined | null,
  headingFamily?: string | null,
  persist = true,
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const bodyConfigured = !(family === undefined || family === null || String(family).trim() === '');
  const fam = bodyConfigured ? String(family).trim() : DEFAULT_FONT;
  const stack = fontStack(fam);
  if (bodyConfigured) {
    ensureFontLoaded(fam);
    root.style.setProperty('--font-body', stack);
    root.style.setProperty('--font-eyebrow', stack);
    root.style.setProperty('--font-sans', stack);
  }

  const headingConfigured = !(headingFamily === undefined || headingFamily === null);
  const headFam = headingConfigured ? String(headingFamily).trim() : '';
  const headStack = headingConfigured ? headingFontStack(headFam) : null;
  if (headingConfigured) {
    if (headStack) {
      ensureFontLoaded(headFam, headingFontCssUrl(headFam));
      root.style.setProperty('--font-heading', headStack);
    } else {
      // '' sentinel — one face sitewide, tracking whatever body resolves to.
      root.style.setProperty('--font-heading', 'var(--font-body)');
    }
  }

  if (persist) {
    try {
      localStorage.setItem(
        TYPO_STORAGE_KEY,
        JSON.stringify({
          v: 3,
          // null = axis not configured → the pre-paint DEFERS to the
          // design-system pre-paint for that axis.
          family: bodyConfigured ? fam : null,
          stack: bodyConfigured ? stack : null,
          url: bodyConfigured ? fontCssUrl(fam) : null,
          heading: !headingConfigured
            ? null
            : headStack
              ? { family: headFam, stack: headStack, url: headingFontCssUrl(headFam) }
              : { collapse: true },
        }),
      );
    } catch {
      /* ignore */
    }
  }
}

/**
 * Inline pre-paint script (string). Reads the persisted EXPLICIT font choices
 * and writes the font CSS vars + injects the font <link>s BEFORE first paint.
 * Placed AFTER the design-system pre-paint in the layout — but an axis only
 * overrides the design-system value when the admin explicitly configured it:
 * - v3 payload: {v:3, family|null, stack|null, url|null,
 *                heading: {family,stack,url} | {collapse:true} | null}
 *   null axis ⇒ DEFER (leave whatever the design-system pre-paint painted).
 * - stale v1/v2 payloads: apply the BODY (always explicit there) but NOT the
 *   heading — v2 persisted the default serif as if it were a choice, which is
 *   exactly the clobber this fixes. The applier re-persists v3 on first load.
 */
export const TYPO_PREPAINT_SCRIPT = `(function(){try{
var s=localStorage.getItem('${TYPO_STORAGE_KEY}');if(!s)return;var d=JSON.parse(s);if(!d)return;
var r=document.documentElement;
var add=function(fam,url){if(!url)return;var id='pah-font-'+(fam||'system').toLowerCase().replace(/\\s+/g,'-');if(!document.getElementById(id)){var l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=url;document.head.appendChild(l);}};
if(d.stack){r.style.setProperty('--font-body',d.stack);r.style.setProperty('--font-eyebrow',d.stack);r.style.setProperty('--font-sans',d.stack);add(d.family,d.url);}
if(d.v===3&&d.heading){if(d.heading.collapse){r.style.setProperty('--font-heading','var(--font-body)');}else if(d.heading.stack){r.style.setProperty('--font-heading',d.heading.stack);add(d.heading.family,d.heading.url);}}
}catch(e){}})();`;
