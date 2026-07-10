/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#2E5E2A', // brand ink / primary
          ink: '#16301A', // darkest text
          600: '#357A3A',
          accent: '#4E8B31', // links / accents
          soft: '#EAF4E6', // tint backgrounds
        },
        cta: { DEFAULT: '#4ADE80', hover: '#3fca72', ink: '#061a0b' },
        cream: '#FAF9F6', // page background
        clay: '#C26B45', // sale / warm accent
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Cormorant Garamond', 'ui-serif', 'serif'],
        body: ['var(--font-body)', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '20px', pill: '9999px' },
      maxWidth: { wrap: '1280px' },
      boxShadow: { soft: '0 1px 3px rgba(22,48,26,.06), 0 10px 30px -14px rgba(22,48,26,.16)' },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
