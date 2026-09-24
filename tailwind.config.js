/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: { bg: '#181a19', surface: '#202321', surface2: '#2b2f2c', border: '#474d48' },
        gray: { 50: '#f7f7f2', 100: '#efefe8', 200: '#dedfd5', 300: '#bfc3b6', 400: '#8b9386', 500: '#697365', 600: '#545e50', 700: '#3d463b', 800: '#292f28', 900: '#1a2119', 950: '#111610' },
        brand: { 50: '#fbefe8', 100: '#f8dfd1', 200: '#ecc0a8', 300: '#e2a083', 400: '#e59a7a', 500: '#bd5130', 600: '#ac4224', 700: '#9c371c', 800: '#812c17', 900: '#692716' }
      },
      fontFamily: {
        // Self-hosted variable faces; the @font-face rules and the reasoning
        // live at the top of src/styles/index.css. The fallbacks still matter:
        // `font-display: swap` paints in them for the first frame, and they are
        // what an artboard export or a blocked font request lands on.
        sans: [
          '"Atkinson Hyperlegible Next"',
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      // Compact workbench type scale. Legacy token names keep shared controls aligned.
      fontSize: {
        'k-eyebrow': ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.1em' }],
        'k-help': ['0.84375rem', { lineHeight: '1.45' }],
        'k-label': ['0.9375rem', { lineHeight: '1.3' }],
        'k-value': ['1rem', { lineHeight: '1.4' }],
        'k-section': ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.022em' }],
      },
      spacing: {
        // The primary control height, and the floor nothing interactive may
        // go under. Both are referenced from index.css as custom properties.
        'k-control': '2.75rem',
        'k-touch': '2.75rem',
      },
      borderRadius: {
        k: '0.1875rem',
        'k-lg': '0.375rem',
      },
      boxShadow: { google: 'none', 'google-hover': 'none', 'google-dark': 'none', 'google-dark-hover': 'none' }
    },
  },
  plugins: [],
}
