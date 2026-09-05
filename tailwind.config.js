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
        // Material Design inspired dark theme background colors
        dark: {
          bg: '#121212', // Base surface
          surface: '#1E1E1E', // Elevated surface 1
          surface2: '#2C2C2C', // Elevated surface 2
          border: '#333333', // Subtle borders
        },
        // Google Blue
        brand: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          200: '#aecbfa',
          300: '#8ab4f8',
          400: '#669df6',
          500: '#4285f4', // Core brand blue
          600: '#1a73e8', // Darker blue for hover/active
          700: '#1967d2',
          800: '#185abc',
          900: '#174ea6',
        }
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
      // Kiosk scale (direction D). Five steps, not seventeen — every size in
      // the shell resolves to one of these.
      fontSize: {
        'k-eyebrow': ['0.8125rem', { lineHeight: '1.2', letterSpacing: '0.1em' }],
        'k-help': ['0.84375rem', { lineHeight: '1.45' }],
        'k-label': ['0.9375rem', { lineHeight: '1.3' }],
        'k-value': ['1.125rem', { lineHeight: '1.4' }],
        'k-section': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.022em' }],
      },
      spacing: {
        // The primary control height, and the floor nothing interactive may
        // go under. Both are referenced from index.css as custom properties.
        'k-control': '3.5rem',
        'k-touch': '2.75rem',
      },
      borderRadius: {
        k: '0.625rem',
        'k-lg': '0.875rem',
      },
      boxShadow: {
        'google': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'google-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
        'google-dark': '0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
        'google-dark-hover': '0 1px 3px 0 rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
