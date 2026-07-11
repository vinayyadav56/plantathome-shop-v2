const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    screens: { xs: '480px', ...defaultTheme.screens, '3xl': '2100px' },
    extend: {
      colors: {
        // ── PlantAtHome brand palette (ported from V1 design system) ──
        forest: {
          DEFAULT: '#2E5E2A', // primary brand green
          ink: '#16301A', // darkest text (v2 alias, == 900)
          900: '#16301A',
          800: '#1E4023',
          700: '#2E5E2A',
          600: '#3A6B33',
          500: '#4E8244', // leaf mid-tone
          accent: '#4E8B31', // links / accents (v2 alias)
          soft: '#EAF4E6', // tint backgrounds (v2 alias)
        },
        cta: { DEFAULT: '#4ADE80', hover: '#3fca72', ink: '#061a0b' },
        olive: { DEFAULT: '#6E8B4A', 500: '#6E8B4A' },
        sage: { DEFAULT: '#E7EEE2', 400: '#8FAE80', 300: '#B3C9A8', 200: '#D2E0CB', 100: '#E7EEE2' },
        clay: { DEFAULT: '#C26B45', 600: '#A8542F', 500: '#C26B45', 300: '#E0A989', 100: '#F3E2D8' },
        cream: { DEFAULT: '#FAF9F6', 50: '#FAF9F6', 100: '#F4F1EA' },
        kraft: { DEFAULT: '#E9E3D6', 200: '#E9E3D6', 300: '#DBD4C4' },
        stone: { 400: '#B6B0A4', 500: '#908A7E', 600: '#6F6A60' },
        ink: { DEFAULT: '#16301A', 900: '#26261F' },
        // back-compat aliases used across ported components
        leaf: '#4E8244',
        deep: '#16301A',
        gold: '#B58E39',
        goldlight: '#E3CE97',
        mint: '#E7EEE2',
        mintsoft: '#F4F1EA',
        sagedeep: '#6E8B4A',
        paper: '#F4F1EA',
        // runtime design-system tokens (fallbacks baked in)
        'ds-accent': 'var(--ds-accent, #4E8B31)',
        'ds-accent-soft': 'var(--ds-accent-soft, #EAF4E6)',
        'ds-accent-ink': 'var(--ds-accent-ink, #2E5E2A)',
        'ds-btn': 'var(--ds-btn, #2E5E2A)',
        'ds-btn-hover': 'var(--ds-btn-hover, #285325)',
        'ds-cta': 'var(--ds-cta, #4ADE80)',
        'ds-cta-hover': 'var(--ds-cta-hover, #41c371)',
        'ds-cta-ink': 'var(--ds-cta-ink, #061a0b)',
      },
      fontFamily: {
        heading: ['var(--font-heading)', '"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['var(--font-heading)', '"Cormorant Garamond"', 'Georgia', 'serif'],
        serif: ['var(--font-heading)', '"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],
        // fixed brand faces (not theme-switched)
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        pahserif: ['var(--font-pahserif)', '"Cormorant Garamond"', 'Georgia', 'serif'],
        poppins: ['var(--font-poppins)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        hanken: ['var(--font-hanken)', 'system-ui', 'Segoe UI', 'sans-serif'],
        jost: ['var(--font-jost)', '"Century Gothic"', 'Futura', 'sans-serif'],
        caveat: ['var(--font-caveat)', 'ui-serif', 'cursive'],
      },
      fontSize: {
        '10px': '0.625rem',
        hero: ['var(--fs-hero)', { lineHeight: '1.04', letterSpacing: '-0.01em' }],
        section: ['var(--fs-section)', { lineHeight: '1.1', letterSpacing: '-0.005em' }],
        subhead: ['var(--fs-subhead)', { lineHeight: '1.2' }],
        'card-title': ['var(--fs-card)', { lineHeight: '1.25' }],
        'body-lg': ['var(--fs-body-lg)', { lineHeight: '1.6' }],
        'body-base': ['var(--fs-body)', { lineHeight: '1.6' }],
        'body-sm': ['var(--fs-sm)', { lineHeight: '1.5' }],
        caption: ['var(--fs-caption)', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      borderRadius: { DEFAULT: '5px', card: '20px', pill: '9999px' },
      maxWidth: { wrap: '1280px', 1920: '1920px' },
      minWidth: { 150: '150px' },
      boxShadow: {
        soft: '0 1px 3px rgba(22,48,26,.06), 0 10px 30px -14px rgba(22,48,26,.16)',
        card: '0 2px 12px rgba(27,94,32,0.08)',
        cardhover: '0 18px 40px -28px rgba(22,48,26,0.35)',
        lift: '0 8px 48px rgba(27,94,32,0.18)',
      },
      transitionTimingFunction: { 'in-expo': 'cubic-bezier(0.04, 0.62, 0.23, 0.98)' },
      keyframes: {
        'cart-bump': { '0%,100%': { transform: 'scale(1)' }, '35%': { transform: 'scale(1.35)' } },
      },
      animation: { 'cart-bump': 'cart-bump .45s cubic-bezier(.16,1,.3,1)' },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
