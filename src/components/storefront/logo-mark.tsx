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
  const accent = light ? 'text-[#8FD56F]' : 'text-forest-600';
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
          className="h-9 w-auto object-contain object-left"
        />
      </span>
    );
  }

  return <WordmarkStacked light={light} className={className} />;
}
