/* ────────────────────────────────────────────────────────────────────────
   PlantAtHome Design System presets — SHARED between admin (the picker) and
   shop (the runtime applier). Keep this file identical in both apps.
   The chosen ids persist in settings.options.designSystem; the applier resolves
   them to CSS font-family values + a Google Fonts URL, applied via CSS vars.
   ──────────────────────────────────────────────────────────────────────── */

export type FontPairing = {
  id: string;
  name: string;
  heading: string; // CSS font-family value
  body: string; // CSS font-family value
  google: string; // Google Fonts css2 `family=` params (no leading ?)
  stars: number; // 1-5 luxury level
  recommended?: boolean;
};

export type ColorScheme = {
  id: string;
  name: string;
  accent: string; // CTAs, links, eyebrows
  accentSoft: string; // tints / chips / icon badges
  accentInk: string; // accent text on light surfaces
  accentRgb: string; // "r, g, b" — drives the shared --color-accent token
  accentInkRgb: string; // "r, g, b" — accent-hover / 600 / 700 shades
};

export type DesignSystem = {
  fontTheme: { id: string; heading: string; body: string };
  colorTheme: { id: string; accent: string; accentSoft: string; accentInk: string; accentRgb: string; accentInkRgb: string };
  /** Backend-controlled button colors: `primary` = solid buttons on light
   *  surfaces, `cta` = the bright call-to-action on dark bands. Hover shades
   *  are derived automatically. */
  buttons: { primary: string; cta: string };
  density: 'comfortable' | 'compact';
};

const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'playfair-inter',
    name: 'Playfair Display + Inter',
    heading: `'Playfair Display', ${SERIF}`,
    body: `'Inter', ${SANS}`,
    google: 'family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600;700',
    stars: 5,
  },
  {
    id: 'cormorant-inter',
    name: 'Cormorant Garamond + Inter',
    heading: `'Cormorant Garamond', ${SERIF}`,
    body: `'Inter', ${SANS}`,
    google: 'family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700',
    stars: 5,
  },
  {
    id: 'dmserif-manrope',
    name: 'DM Serif Display + Manrope',
    heading: `'DM Serif Display', ${SERIF}`,
    body: `'Manrope', ${SANS}`,
    google: 'family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800',
    stars: 5,
  },
  {
    id: 'libre-inter',
    name: 'Libre Baskerville + Inter',
    heading: `'Libre Baskerville', ${SERIF}`,
    body: `'Inter', ${SANS}`,
    google: 'family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;500;600;700',
    stars: 4,
  },
  {
    id: 'merriweather-sourcesans',
    name: 'Merriweather + Source Sans',
    heading: `'Merriweather', ${SERIF}`,
    body: `'Source Sans 3', ${SANS}`,
    google: 'family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@400;500;600;700',
    stars: 4,
  },
  {
    id: 'lora-manrope',
    name: 'Lora + Manrope',
    heading: `'Lora', ${SERIF}`,
    body: `'Manrope', ${SANS}`,
    google: 'family=Lora:wght@500;600;700&family=Manrope:wght@400;500;600;700;800',
    stars: 4,
  },
  {
    id: 'poppins-poppins',
    name: 'Poppins',
    heading: `'Poppins', ${SANS}`,
    body: `'Poppins', ${SANS}`,
    google: 'family=Poppins:wght@400;500;600;700;800',
    stars: 3,
  },
  {
    id: 'jakarta-jakarta',
    name: 'Plus Jakarta Sans',
    heading: `'Plus Jakarta Sans', ${SANS}`,
    body: `'Plus Jakarta Sans', ${SANS}`,
    google: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800',
    stars: 4,
  },
  {
    id: 'outfit-inter',
    name: 'Outfit + Inter',
    heading: `'Outfit', ${SANS}`,
    body: `'Inter', ${SANS}`,
    google: 'family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700',
    stars: 4,
  },
  {
    id: 'manrope-inter',
    name: 'Manrope + Inter',
    heading: `'Manrope', ${SANS}`,
    body: `'Inter', ${SANS}`,
    google: 'family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700',
    stars: 5,
  },
  {
    id: 'cormorant-manrope',
    name: 'Cormorant Garamond + Manrope',
    heading: `'Cormorant Garamond', 'Playfair Display', ${SERIF}`,
    body: `'Manrope', 'Inter', ${SANS}`,
    google: 'family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800',
    stars: 5,
    recommended: true,
  },
];

/**
 * ⚠️ THIS LIST IS THE RENDER CONTRACT. The shop resolves a persisted scheme by
 * id and SILENTLY falls back to COLOR_SCHEMES[0] when the id is unknown — so any
 * scheme the admin offers but the shop lacks makes the admin preview lie about
 * what the storefront will actually render. Add schemes to BOTH copies or not at
 * all. (`fresh-green` shipped in admin only and was invisibly downgraded here.)
 *
 * `pine` (#2E5E2A) is first, and therefore the default, because it is the
 * official PlantAtHome dark green: the most-used brand hex in the storefront,
 * already `forest.DEFAULT`/`forest.700` in the Tailwind palette, already
 * DEFAULT_BUTTONS.primary, and 7.63:1 on white (AA body / AAA large). The
 * previous default `forest` (#4E8B31) FAILS WCAG AA at 4.15:1 and it was the
 * colour of every accent link on the site — so this also fixes a contrast bug.
 * Making it the default additionally resolves the long-standing split where the
 * default accent and the default button colour were two different greens.
 */
export const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'pine', name: 'PlantAtHome Green (default)', accent: '#2E5E2A', accentSoft: '#E7EEE2', accentInk: '#1E4023', accentRgb: '46, 94, 42', accentInkRgb: '30, 64, 35' },
  { id: 'fresh-green', name: 'Fresh Green', accent: '#1F6B3D', accentSoft: '#E8F5EE', accentInk: '#0D3B24', accentRgb: '31, 107, 61', accentInkRgb: '13, 59, 36' },
  { id: 'forest', name: 'Forest (lighter — fails AA for text)', accent: '#4E8B31', accentSoft: '#EAF4E6', accentInk: '#2E5E2A', accentRgb: '78, 139, 49', accentInkRgb: '46, 94, 42' },
  { id: 'emerald', name: 'Emerald', accent: '#1B7A4B', accentSoft: '#E2F3EB', accentInk: '#125C38', accentRgb: '27, 122, 75', accentInkRgb: '18, 92, 56' },
  { id: 'terracotta', name: 'Terracotta', accent: '#C26B45', accentSoft: '#F3E2D8', accentInk: '#A8542F', accentRgb: '194, 107, 69', accentInkRgb: '168, 84, 47' },
];

export const DENSITIES = [
  { id: 'comfortable', name: 'Comfortable' },
  { id: 'compact', name: 'Compact' },
] as const;

export const DEFAULT_FONT_PAIRING =
  FONT_PAIRINGS.find((p) => p.recommended) ?? FONT_PAIRINGS[FONT_PAIRINGS.length - 1];
export const DEFAULT_COLOR_SCHEME = COLOR_SCHEMES[0];

// Defaults reproduce the storefront's shipped look: forest-700 solid buttons
// on light surfaces + the bright lime CTA used on dark bands.
export const DEFAULT_BUTTONS = { primary: '#2E5E2A', cta: '#4ADE80' };
/** Fixed readable ink on the (bright) CTA color. */
export const CTA_INK = '#061a0b';

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Mix a hex colour toward white by `amount` (0-1) — derives the soft tints.
 *
 * The 200/300/400 rungs used to be hardcoded Pickbazar emerald (#a7f3d0 /
 * #6ee7b7 / #34d399) while only the base and 500-700 rungs were ever repointed,
 * so `bg-accent` rendered brand green and `bg-accent-400` rendered teal from the
 * same "accent" family. Deriving them from the active scheme keeps the whole
 * ramp one hue, and keeps it correct for non-green schemes like Terracotta.
 */
export function tintHex(hex: string, amount: number): string {
  const m = HEX_RE.exec(hex?.trim?.() ?? '');
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + (255 - v) * amount)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `${r}, ${g}, ${b}`;
}

/** Darken a hex color by `amount` (0-1) — used to derive hover shades. */
export function darkenHex(hex: string, amount = 0.12): string {
  const m = HEX_RE.exec(hex?.trim?.() ?? '');
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const safeHex = (v: any, fallback: string): string =>
  typeof v === 'string' && HEX_RE.test(v.trim()) ? v.trim() : fallback;

export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  fontTheme: {
    id: DEFAULT_FONT_PAIRING.id,
    heading: DEFAULT_FONT_PAIRING.heading,
    body: DEFAULT_FONT_PAIRING.body,
  },
  colorTheme: {
    id: DEFAULT_COLOR_SCHEME.id,
    accent: DEFAULT_COLOR_SCHEME.accent,
    accentSoft: DEFAULT_COLOR_SCHEME.accentSoft,
    accentInk: DEFAULT_COLOR_SCHEME.accentInk,
    accentRgb: DEFAULT_COLOR_SCHEME.accentRgb,
    accentInkRgb: DEFAULT_COLOR_SCHEME.accentInkRgb,
  },
  buttons: { ...DEFAULT_BUTTONS },
  density: 'comfortable',
};

export const GOOGLE_FONTS_BASE = 'https://fonts.googleapis.com/css2?';

/** Build the Google Fonts stylesheet URL for a pairing (by id or object). */
export function googleFontsUrl(pairing: FontPairing | string | undefined | null): string | null {
  const p = typeof pairing === 'string' ? FONT_PAIRINGS.find((x) => x.id === pairing) : pairing;
  if (!p) return null;
  return `${GOOGLE_FONTS_BASE}${p.google}&display=swap`;
}

/** Resolve a persisted designSystem (possibly partial) to a complete object. */
export function resolveDesignSystem(raw: any): DesignSystem {
  const fp = FONT_PAIRINGS.find((p) => p.id === raw?.fontTheme?.id) ?? DEFAULT_FONT_PAIRING;
  const cs = COLOR_SCHEMES.find((c) => c.id === raw?.colorTheme?.id) ?? DEFAULT_COLOR_SCHEME;
  const density = raw?.density === 'compact' ? 'compact' : 'comfortable';

  // Drift alarm. An id the admin saved but this app does not define is silently
  // downgraded to the default above, which is how `fresh-green` shipped as the
  // admin's default while the storefront rendered `forest` and nobody noticed.
  // Fail loudly in dev rather than render a different brand than the one the
  // operator picked.
  if (process.env.NODE_ENV !== 'production') {
    if (raw?.colorTheme?.id && raw.colorTheme.id !== cs.id) {
      console.warn(
        `[design-system] unknown colour scheme "${raw.colorTheme.id}" — falling back to "${cs.id}". ` +
          'The admin and shop copies of design-system.ts have drifted; sync them.',
      );
    }
    if (raw?.fontTheme?.id && raw.fontTheme.id !== fp.id) {
      console.warn(
        `[design-system] unknown font pairing "${raw.fontTheme.id}" — falling back to "${fp.id}". ` +
          'The admin and shop copies of design-system.ts have drifted; sync them.',
      );
    }
  }
  return {
    fontTheme: { id: fp.id, heading: fp.heading, body: fp.body },
    colorTheme: { id: cs.id, accent: cs.accent, accentSoft: cs.accentSoft, accentInk: cs.accentInk, accentRgb: cs.accentRgb, accentInkRgb: cs.accentInkRgb },
    buttons: {
      primary: safeHex(raw?.buttons?.primary, DEFAULT_BUTTONS.primary),
      cta: safeHex(raw?.buttons?.cta, DEFAULT_BUTTONS.cta),
    },
    density,
  };
}

export const DS_STORAGE_KEY = 'pah-design-system';

/** Inject the Google Fonts <link> for a pairing once (browser only). */
export function ensureFontLoaded(pairingId: string | undefined | null): void {
  if (typeof document === 'undefined' || !pairingId) return;
  const id = `ds-font-${pairingId}`;
  if (document.getElementById(id)) return;
  const href = googleFontsUrl(pairingId);
  if (!href) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Apply a (possibly partial) design system to <html> via CSS vars (browser only). */
export function applyDesignSystem(raw: any, persist = true): DesignSystem {
  const ds = resolveDesignSystem(raw);
  if (typeof document === 'undefined') return ds;
  const root = document.documentElement;
  ensureFontLoaded(ds.fontTheme.id);
  root.style.setProperty('--font-heading', ds.fontTheme.heading);
  root.style.setProperty('--font-body', ds.fontTheme.body);
  root.style.setProperty('--ds-accent', ds.colorTheme.accent);
  root.style.setProperty('--ds-accent-soft', ds.colorTheme.accentSoft);
  root.style.setProperty('--ds-accent-ink', ds.colorTheme.accentInk);
  // Drive the shared RGB accent token so every existing bg-accent/text-accent/
  // accent-* utility (both apps) follows the chosen scheme.
  root.style.setProperty('--color-accent', ds.colorTheme.accentRgb);
  root.style.setProperty('--color-accent-hover', ds.colorTheme.accentInkRgb);
  root.style.setProperty('--color-accent-500', ds.colorTheme.accentRgb);
  root.style.setProperty('--color-accent-600', ds.colorTheme.accentInkRgb);
  root.style.setProperty('--color-accent-700', ds.colorTheme.accentInkRgb);
  // Soft rungs derived from the SAME accent, so the ramp is one hue end to end
  // (these were previously left at hardcoded Pickbazar emerald).
  root.style.setProperty('--color-accent-200', tintHex(ds.colorTheme.accent, 0.78));
  root.style.setProperty('--color-accent-300', tintHex(ds.colorTheme.accent, 0.6));
  root.style.setProperty('--color-accent-400', tintHex(ds.colorTheme.accent, 0.38));
  // Backend-controlled button colors (bg-ds-btn / bg-ds-cta utilities).
  root.style.setProperty('--ds-btn', ds.buttons.primary);
  root.style.setProperty('--ds-btn-hover', darkenHex(ds.buttons.primary));
  root.style.setProperty('--ds-cta', ds.buttons.cta);
  root.style.setProperty('--ds-cta-hover', darkenHex(ds.buttons.cta));
  root.style.setProperty('--ds-cta-ink', CTA_INK);
  root.setAttribute('data-density', ds.density);
  if (persist) {
    try {
      // Store resolved values + the font URL so the pre-paint script in
      // _document can apply them directly (no config import) without FOUC.
      localStorage.setItem(
        DS_STORAGE_KEY,
        JSON.stringify({
          heading: ds.fontTheme.heading,
          body: ds.fontTheme.body,
          accent: ds.colorTheme.accent,
          accentSoft: ds.colorTheme.accentSoft,
          accentInk: ds.colorTheme.accentInk,
          accentRgb: ds.colorTheme.accentRgb,
          accentInkRgb: ds.colorTheme.accentInkRgb,
          btn: ds.buttons.primary,
          btnHover: darkenHex(ds.buttons.primary),
          cta: ds.buttons.cta,
          ctaHover: darkenHex(ds.buttons.cta),
          density: ds.density,
          google: googleFontsUrl(ds.fontTheme.id),
          fontId: ds.fontTheme.id,
          colorId: ds.colorTheme.id,
        }),
      );
    } catch (e) {
      /* ignore */
    }
  }
  return ds;
}

/** The inline pre-paint script (string) — reads DS_STORAGE_KEY and applies CSS
 *  vars + lazy font link on <html> before first paint to avoid FOUC. Embed the
 *  SAME string in both apps' _document.tsx. */
export const DS_PREPAINT_SCRIPT =
  "(function(){try{var s=localStorage.getItem('" +
  DS_STORAGE_KEY +
  "');if(!s)return;var d=JSON.parse(s);var r=document.documentElement;if(d.heading)r.style.setProperty('--font-heading',d.heading);if(d.body)r.style.setProperty('--font-body',d.body);if(d.accent)r.style.setProperty('--ds-accent',d.accent);if(d.accentSoft)r.style.setProperty('--ds-accent-soft',d.accentSoft);if(d.accentInk)r.style.setProperty('--ds-accent-ink',d.accentInk);if(d.accentRgb){r.style.setProperty('--color-accent',d.accentRgb);r.style.setProperty('--color-accent-500',d.accentRgb);}if(d.accentInkRgb){r.style.setProperty('--color-accent-hover',d.accentInkRgb);r.style.setProperty('--color-accent-600',d.accentInkRgb);r.style.setProperty('--color-accent-700',d.accentInkRgb);}if(d.btn){r.style.setProperty('--ds-btn',d.btn);}if(d.btnHover){r.style.setProperty('--ds-btn-hover',d.btnHover);}if(d.cta){r.style.setProperty('--ds-cta',d.cta);}if(d.ctaHover){r.style.setProperty('--ds-cta-hover',d.ctaHover);}if(d.density)r.setAttribute('data-density',d.density);if(d.google&&d.fontId){var id='ds-font-'+d.fontId;if(!document.getElementById(id)){var l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=d.google;document.head.appendChild(l);}}}catch(e){}})();";
