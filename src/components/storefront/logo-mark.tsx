import { useSettings } from '@/framework/settings';

/** Larger house + plant line mark for the product-card placeholder (matches the
 *  reference art): a rounded house outline with a sprout of leaves growing inside. */
export function PlantMark({
  className = '',
  stroke = 'currentColor',
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* house */}
      <path d="M13 32 32 15l19 17" />
      <path d="M19 29v18h7" />
      <path d="M45 29v18h-7" />
      {/* plant — stem + two leaf pairs */}
      <path d="M32 47V27" />
      <path d="M32 30c-7 0-11-4-11-10 7 0 11 4 11 10Z" />
      <path d="M32 30c7 0 11-4 11-10-7 0-11 4-11 10Z" />
      <path d="M32 40c-5.5 0-9-3-9-7.5 5.5 0 9 3 9 7.5Z" />
      <path d="M32 40c5.5 0 9-3 9-7.5-5.5 0-9 3-9 7.5Z" />
    </svg>
  );
}

/** Premium placeholder mark: a house roofline with a sprout/leaf rising through it.
 *  Single-colour, print-ready. Swap with the user's reference art when provided. */
export function LogoMark({
  className = '',
  stroke = 'currentColor',
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* house */}
      <path d="M9 22 24 9l15 13" />
      <path d="M12 21v16h24V21" />
      {/* sprout inside */}
      <path d="M24 37v-9" />
      <path d="M24 30c0-3-2.4-5-5.2-5C18.8 28 21 30 24 30Z" fill={stroke} stroke="none" />
      <path d="M24 28c0-3 2.4-5.4 5.4-5.4C29.4 25.8 27 28 24 28Z" fill={stroke} stroke="none" />
    </svg>
  );
}

/** Horizontal brand lockup (per the home reference): leaf mark + two-tone
 *  "Plant atHome" serif name + small caps tagline. */
export function WordmarkStacked({
  light = false,
  className = '',
}: {
  light?: boolean;
  className?: string;
}) {
  const fg = light ? 'text-white' : 'text-forest-900';
  // The light variant's accent used to be #8FD56F — the same lime the home hero
  // uses for its own accents, sitting on a dark-green translucent header over a
  // dark-green hero. Three greens in a stack, so the mark did not read as a mark.
  // White at 80% keeps the two-tone lockup (weight + opacity carry it) while
  // staying legible on any dark surface. The dark variant is unchanged: forest
  // green on light backgrounds already has the contrast.
  const accent = light ? 'text-white/80' : 'text-forest-600';
  const tagline = light ? 'text-white/70' : 'text-stone-500';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-7 w-7 shrink-0 ${accent}`} aria-hidden>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6" />
      </svg>
      <span className="flex flex-col">
        <span className={`font-pahserif text-[20px] font-bold leading-none ${fg}`}>
          Plant <span className={accent}>atHome</span>
        </span>
        <span className={`mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] ${tagline}`}>
          Bring Nature Home
        </span>
      </span>
    </span>
  );
}

export function BrandLogo({
  light = false,
  className = '',
}: {
  light?: boolean;
  className?: string;
}) {
  // Admin-managed logos (Tools → Logo & Branding) take precedence. Falls back to
  // the stacked serif wordmark (mockup style) when no logo is uploaded.
  const { settings }: any = useSettings();
  const uploaded = light
    ? settings?.headerLogoLight?.original
    : settings?.headerLogoDark?.original || settings?.logo?.original;

  if (uploaded) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uploaded}
          alt={settings?.siteTitle || 'PlantAtHome'}
          // On the dark header the uploaded mark is forced to white
          // (brightness-0 invert) — the green-on-green asset was invisible.
          // Needs a transparent-background logo; an opaque one should be
          // re-uploaded as headerLogoLight instead.
          // mix-blend-multiply melts the asset's opaque white background into
          // the light glass pill (white × anything = anything); the dark/light
          // logic is untouched — the light variant is forced white via invert.
          className={`h-auto max-h-[64px] w-[190px] object-contain object-left ${light ? 'brightness-0 invert' : 'mix-blend-multiply'}`}
        />
      </span>
    );
  }

  return <WordmarkStacked light={light} className={className} />;
}
