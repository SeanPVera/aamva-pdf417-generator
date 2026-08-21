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
        // Federal Blue (Apple meets Uncle Sam)
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#14295a', // Core Federal Blue
          600: '#10224a',
          700: '#0d1b3b',
          800: '#09142b',
          900: '#060c1c',
        },
        // Old Glory Red
        destructive: {
          500: '#c0392b',
        }
      },
      fontFamily: {
        // No webfont is loaded (see src/styles/index.css), so these named
        // families only apply when the OS already has them. `system-ui` and
        // `-apple-system` are what actually resolve: San Francisco on iOS,
        // Roboto on Android, Segoe on Windows. Without them iOS falls all the
        // way through to Helvetica.
        sans: [
          '"Google Sans"',
          '"Inter"',
          '"Roboto"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      boxShadow: {
        'google': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'google-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
        'google-dark': '0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
        'google-dark-hover': '0 1px 3px 0 rgba(0,0,0,0.3), 0 4px 8px 3px rgba(0,0,0,0.15)',
        'apple-sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'apple-md': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
