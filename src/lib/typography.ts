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

/** Google Fonts stylesheet URL for a family (null for the System stack). */
export function fontCssUrl(family: string): string | null {
  if (isSystem(family)) return null;
  return `https://fonts.googleapis.com/css2?family=${family.trim().replace(/\s+/g, '+')}:${FONT_WEIGHTS}&display=swap`;
}

/** Full CSS font-family value for a family (quoted if multi-word) + fallback. */
export function fontStack(family: string): string {
  if (isSystem(family)) return FALLBACK;
  const f = family.trim();
  const quoted = /\s/.test(f) ? `'${f}'` : f;
  return `${quoted}, ${FALLBACK}`;
}

const linkId = (family: string) => 'pah-font-' + (family || 'system').trim().toLowerCase().replace(/\s+/g, '-');

/** Inject the Google Fonts <link> for a family once (browser only). */
export function ensureFontLoaded(family: string): void {
  if (typeof document === 'undefined') return;
  const href = fontCssUrl(family);
  if (!href) return;
  const id = linkId(family);
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Apply the website font to ALL text via CSS vars + persist for the next
 *  load's pre-paint script. Browser only. */
export function applyTypography(family: string | undefined | null, persist = true): void {
  const fam = (family && String(family).trim()) || DEFAULT_FONT;
  if (typeof document === 'undefined') return;
  ensureFontLoaded(fam);
  const stack = fontStack(fam);
  const root = document.documentElement;
  root.style.setProperty('--font-heading', stack);
  root.style.setProperty('--font-body', stack);
  root.style.setProperty('--font-eyebrow', stack);
  root.style.setProperty('--font-sans', stack);
  if (persist) {
    try {
      localStorage.setItem(TYPO_STORAGE_KEY, JSON.stringify({ family: fam, stack, url: fontCssUrl(fam) }));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Inline pre-paint script (string). Reads the persisted font (default Inter) and
 * writes the font CSS vars + injects the font <link> BEFORE first paint, so there
 * is no flash of the previous/design-system font. Must be placed AFTER the
 * design-system pre-paint script in the layout so the single website font wins.
 */
export const TYPO_PREPAINT_SCRIPT = `(function(){try{
var DEF={family:'Inter',stack:"'Inter', ${FALLBACK}",url:'https://fonts.googleapis.com/css2?family=Inter:${FONT_WEIGHTS}&display=swap'};
var d=DEF;try{var s=localStorage.getItem('${TYPO_STORAGE_KEY}');if(s){var p=JSON.parse(s);if(p&&p.stack)d=p;}}catch(e){}
var r=document.documentElement;
r.style.setProperty('--font-heading',d.stack);r.style.setProperty('--font-body',d.stack);r.style.setProperty('--font-eyebrow',d.stack);r.style.setProperty('--font-sans',d.stack);
if(d.url){var id='pah-font-'+(d.family||'system').toLowerCase().replace(/\\s+/g,'-');if(!document.getElementById(id)){var l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=d.url;document.head.appendChild(l);}}
}catch(e){}})();`;
