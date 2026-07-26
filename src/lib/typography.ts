/**
 * Website font family — a single, admin-switchable font applied to EVERYTHING
 * (headings, subheadings, and body) so the whole storefront uses one typeface.
 * Default: Inter. Driven by `settings.options.typography.fontFamily`.
 *
 * This intentionally supersedes the design-system's split heading/body pairing:
 * it sets --font-heading, --font-body, --font-eyebrow and --font-sans to the one
 * family, and is applied AFTER the design-system applier so it wins. The rem type
 * scale (--h1..--h6 / --fs-*) is untouched, so the size hierarchy is preserved.
 */

export const TYPO_STORAGE_KEY = 'pah-font-family';
export const DEFAULT_FONT = 'Inter';
export const DEFAULT_HEADING_FONT = 'Playfair Display';

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
  { value: 'Playfair Display', name: 'Playfair Display (default)' },
  { value: 'Cormorant Garamond', name: 'Cormorant Garamond' },
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
 *  pre-paint script. Browser only. Two axes:
 *  - body family → --font-body / --font-sans / --font-eyebrow (default Inter)
 *  - heading family → --font-heading (default Playfair Display; the '' sentinel
 *    or "Same as body" collapses headings back onto the body stack)
 *  headingFamily === undefined/null means "not configured" → serif default;
 *  '' means the admin explicitly chose one face sitewide. */
export function applyTypography(
  family: string | undefined | null,
  headingFamily?: string | null,
  persist = true,
): void {
  const fam = (family && String(family).trim()) || DEFAULT_FONT;
  const headFam =
    headingFamily === undefined || headingFamily === null
      ? DEFAULT_HEADING_FONT
      : String(headingFamily).trim();
  if (typeof document === 'undefined') return;
  ensureFontLoaded(fam);
  const stack = fontStack(fam);
  const headStack = headingFontStack(headFam);
  if (headStack) ensureFontLoaded(headFam, headingFontCssUrl(headFam));
  const root = document.documentElement;
  root.style.setProperty('--font-heading', headStack ?? stack);
  root.style.setProperty('--font-body', stack);
  root.style.setProperty('--font-eyebrow', stack);
  root.style.setProperty('--font-sans', stack);
  if (persist) {
    try {
      localStorage.setItem(
        TYPO_STORAGE_KEY,
        JSON.stringify({
          v: 2,
          family: fam,
          stack,
          url: fontCssUrl(fam),
          heading: headStack
            ? { family: headFam, stack: headStack, url: headingFontCssUrl(headFam) }
            : null,
        }),
      );
    } catch {
      /* ignore */
    }
  }
}

/**
 * Inline pre-paint script (string). Reads the persisted fonts (default Inter
 * body + Playfair Display headings) and writes the font CSS vars + injects the
 * font <link>s BEFORE first paint, so there is no flash of the previous/
 * design-system font. Must be placed AFTER the design-system pre-paint script
 * in the layout so these values win.
 * Payload versions: v2 = {v:2, family, stack, url, heading:{...}|null}; a stale
 * v1 payload (no `v`) predates the heading axis → paint the DEFAULT heading
 * serif (matches the server default; the applier re-persists v2 on load).
 */
export const TYPO_PREPAINT_SCRIPT = `(function(){try{
var DEF={family:'Inter',stack:"'Inter', ${FALLBACK}",url:'https://fonts.googleapis.com/css2?family=Inter:${FONT_WEIGHTS};900&display=swap',heading:{family:'${DEFAULT_HEADING_FONT}',stack:"'${DEFAULT_HEADING_FONT}', ${SERIF_FALLBACK}",url:'${headingFontCssUrl(DEFAULT_HEADING_FONT)}'}};
var d=DEF;try{var s=localStorage.getItem('${TYPO_STORAGE_KEY}');if(s){var p=JSON.parse(s);if(p&&p.stack)d=p;}}catch(e){}
var h=(d.v===2)?d.heading:DEF.heading;
var r=document.documentElement;
r.style.setProperty('--font-heading',(h&&h.stack)||d.stack);r.style.setProperty('--font-body',d.stack);r.style.setProperty('--font-eyebrow',d.stack);r.style.setProperty('--font-sans',d.stack);
var add=function(fam,url){if(!url)return;var id='pah-font-'+(fam||'system').toLowerCase().replace(/\\s+/g,'-');if(!document.getElementById(id)){var l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=url;document.head.appendChild(l);}};
add(d.family,d.url);if(h)add(h.family,h.url);
}catch(e){}})();`;
