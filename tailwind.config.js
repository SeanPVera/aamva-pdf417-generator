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
        sans: ['"Google Sans"', '"Inter"', '"Roboto"', 'sans-serif'],
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
