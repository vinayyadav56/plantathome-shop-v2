const defaultTheme = require('tailwindcss/defaultTheme');

// Single website font: every text alias resolves to the one --font-sans variable
// (default Inter, admin-switchable) so headings, subheadings and body share one
// typeface. Only `mono` stays monospace.
const SANS = [
  'var(--font-sans)',
  'Inter',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
];

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    } else {
      return `rgb(var(${variableName}))`;
    }
  };
}

module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '480px',
      ...defaultTheme.screens,
    },
    extend: {
      screens: {
        xs: '490px',
        ...defaultTheme.screens,
        '3xl': '2100px',
      },
      zIndex: {
        '-1': '-1',
      },
      fontFamily: {
        // Every text alias resolves to the single --font-sans variable so the
        // admin "Website font" control swaps the WHOLE site's typeface in one
        // click (default Inter). Headings, subheadings, body and the former
        // brand/display fonts all share one face. Only `mono` stays monospace.
        body: SANS,
        sans: SANS,
        heading: SANS,
        display: SANS,
        serif: SANS,
        cormorant: SANS,
        playfair: SANS,
        poppins: SANS,
        caveat: SANS,
        hanken: SANS,
        jost: SANS,
        pahserif: SANS,
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '10px': '0.625rem',
        h1: 'var(--h1)',
        h2: 'var(--h2)',
        h3: 'var(--h3)',
        h4: 'var(--h4)',
        h5: 'var(--h5)',
        h6: 'var(--h6)',
        // ── Design-system responsive type scale (clamp-based; see main.css) ──
        hero: ['var(--fs-hero)', { lineHeight: '1.04', letterSpacing: '-0.01em' }],
        section: ['var(--fs-section)', { lineHeight: '1.1', letterSpacing: '-0.005em' }],
        subhead: ['var(--fs-subhead)', { lineHeight: '1.2' }],
        'card-title': ['var(--fs-card)', { lineHeight: '1.25' }],
        'body-lg': ['var(--fs-body-lg)', { lineHeight: '1.6' }],
        'body-base': ['var(--fs-body)', { lineHeight: '1.6' }],
        'body-sm': ['var(--fs-sm)', { lineHeight: '1.5' }],
        caption: ['var(--fs-caption)', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      colors: {
        // ── Switchable accent (driven by the admin Design System color scheme) ──
        // Defaults to the storefront green in main.css; the color picker swaps it.
        'ds-accent': 'var(--ds-accent)',
        'ds-accent-soft': 'var(--ds-accent-soft)',
        'ds-accent-ink': 'var(--ds-accent-ink)',
        // ── Backend-controlled button colors (admin Design System → Buttons) ──
        // var() fallbacks reproduce the shipped look before any admin choice.
        'ds-btn': 'var(--ds-btn, #2E5E2A)',
        'ds-btn-hover': 'var(--ds-btn-hover, #285325)',
        'ds-cta': 'var(--ds-cta, #4ADE80)',
        'ds-cta-hover': 'var(--ds-cta-hover, #41c371)',
        'ds-cta-ink': 'var(--ds-cta-ink, #061a0b)',
        // ── Approved neutral tokens (premium luxury palette) ──
        'pa-bg': 'var(--pa-bg)',
        'pa-card': 'var(--pa-card)',
        'pa-text': 'var(--pa-text)',
        'pa-text-2': 'var(--pa-text-2)',
        'pa-border': 'var(--pa-border)',
        // ── Plant At Home Design System palette ──
        forest: {
          DEFAULT: '#2E5E2A', // primary brand green (buttons, mark)
          900: '#16301A', // primary ink / wordmark
          800: '#1E4023',
          700: '#2E5E2A',
          600: '#3A6B33',
          500: '#4E8244', // leaf mid-tone
        },
        olive: { DEFAULT: '#6E8B4A', 500: '#6E8B4A' },
        sage: {
          DEFAULT: '#E7EEE2', // green tint background / chips
          400: '#8FAE80',
          300: '#B3C9A8',
          200: '#D2E0CB',
          100: '#E7EEE2',
        },
        clay: {
          DEFAULT: '#C26B45', // warm accent, sale tags, pots
          600: '#A8542F',
          500: '#C26B45',
          300: '#E0A989',
          100: '#F3E2D8',
        },
        cream: {
          DEFAULT: '#FAF9F6', // page background
          50: '#FAF9F6',
          100: '#F4F1EA',
        },
        kraft: {
          DEFAULT: '#E9E3D6', // warm card border
          200: '#E9E3D6',
          300: '#DBD4C4',
        },
        stone: { 400: '#B6B0A4', 500: '#908A7E', 600: '#6F6A60' },
        ink: { DEFAULT: '#16301A', 900: '#26261F' },
        // back-compat aliases (older storefront usage)
        leaf: '#4E8244',
        deep: '#16301A',
        gold: '#B58E39',
        goldlight: '#E3CE97',
        mint: '#E7EEE2',
        mintsoft: '#F4F1EA',
        sagedeep: '#6E8B4A',
        paper: '#F4F1EA',
        light: withOpacity('--color-light'),
        dark: withOpacity('--color-dark'),
        accent: withOpacity('--color-accent'),
        'muted-black': withOpacity('--color-muted-black'),
        'base-dark': withOpacity('--text-base-dark'),
        'accent-hover': withOpacity('--color-accent-hover'),
        'accent-200': withOpacity('--color-accent-200'),
        'accent-300': withOpacity('--color-accent-300'),
        'accent-400': withOpacity('--color-accent-400'),
        'accent-500': withOpacity('--color-accent-500'),
        'accent-600': withOpacity('--color-accent-600'),
        'accent-700': withOpacity('--color-accent-700'),
        'border-50': withOpacity('--color-border-50'),
        'border-100': withOpacity('--color-border-100'),
        'border-200': withOpacity('--color-border-200'),
        'border-base': withOpacity('--color-border-base'),
        'border-400': withOpacity('--color-border-400'),
        'gray-50': withOpacity('--color-gray-50'),
        'gray-100': withOpacity('--color-gray-100'),
        'gray-200': withOpacity('--color-gray-200'),
        'gray-300': withOpacity('--color-gray-300'),
        'gray-400': withOpacity('--color-gray-400'),
        'gray-500': withOpacity('--color-gray-500'),
        'gray-600': withOpacity('--color-gray-600'),
        'gray-700': withOpacity('--color-gray-700'),
        'gray-800': withOpacity('--color-gray-800'),
        'gray-900': withOpacity('--color-gray-900'),
        'orange-50': withOpacity('--color-orange-50'),
        'orange-100': withOpacity('--color-orange-100'),
        'orange-200': withOpacity('--color-orange-200'),
        'orange-300': withOpacity('--color-orange-300'),
        'orange-400': withOpacity('--color-orange-400'),
        'orange-500': withOpacity('--color-orange-500'),
        'orange-600': withOpacity('--color-orange-600'),
        'orange-700': withOpacity('--color-orange-700'),
        'orange-800': withOpacity('--color-orange-800'),
        'orange-900': withOpacity('--color-orange-900'),
        social: {
          facebook: '#3b5998',
          'facebook-hover': '#35508a',
          twitter: '#1da1f2',
          instagram: '#e1306c',
          youtube: '#ff0000',
          google: '#4285f4',
          'google-hover': '#3574de',
        },
        status: {
          pending: withOpacity('--color-pending'),
          processing: withOpacity('--color-processing'),
          complete: withOpacity('--color-complete'),
          canceled: withOpacity('--color-canceled'),
          failed: withOpacity('--color-failed'),
          'out-for-delivery': withOpacity('--color-out-for-delivery'),
        },
      },
      textColor: {
        body: withOpacity('--text-base'),
        'body-dark': withOpacity('--text-base-dark'),
        muted: withOpacity('--text-muted'),
        'muted-light': withOpacity('--text-muted-light'),
        heading: withOpacity('--text-heading'),
        'sub-heading': withOpacity('--text-sub-heading'),
        bolder: withOpacity('--text-text-bolder'),
      },
      minHeight: {
        580: '580px',
        140: '35rem', // 560px
        40: '10rem', // 140px
        6: '2.5rem',
      },
      height: {
        4.5: '1.125rem',
        13: '3.125rem',
        22: '5.25rem',
        double: '200%',
      },
      maxHeight: {
        '70vh': '70vh',
        '85vh': '85vh',
        140: '35rem', // 560px
      },
      maxWidth: {
        1920: '1920px',
      },
      minWidth: {
        150: '150px',
      },
      borderRadius: {
        DEFAULT: '5px',
      },
      inset: {
        22: '5.25rem',
      },
      strokeWidth: {
        2.5: '2.5',
      },
      boxShadow: {
        200: 'rgba(0, 0, 0, 0.16) 0px 3px 6px',
        300: 'rgba(0, 0, 0, 0.16) 0px 0px 6px',
        350: 'rgba(0, 0, 0, 0.16) 0px 3px 6px',
        400: 'rgba(0, 0, 0, 0.1) 0px 0px 8px 0',
        500: 'rgba(0, 0, 0, 0.17) 0px 0px 12px',
        600: 'rgba(0, 0, 0, 0.1) 0px 3px 8px',
        700: 'rgba(0, 0, 0, 0.08) 0px 2px 16px',
        900: 'rgba(0, 0, 0, 0.05) 0px 21px 36px',
        downfall: 'rgba(0, 0, 0, 0.14) 0px 6px 12px',
        paymentCard: '0px 2px 6px rgba(59, 74, 92, 0.1)',
        'downfall-xs': 'rgba(0, 0, 0, 0.14) 0px 1px 2px',
        'downfall-sm': 'rgba(0, 0, 0, 0.14) 0px 2px 4px',
        'downfall-lg': 'rgba(0, 0, 0, 0.16) 0px 8px 16px',
        cardAction:
          '0 0 0 1px #8898aa1a, 0 15px 35px #31315d1a, 0 5px 15px #00000014',
      },
      transitionProperty: {
        height: 'height',
      },
      transitionTimingFunction: {
        'in-expo': 'cubic-bezier(0.04, 0.62, 0.23, 0.98)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
