/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#FFF5F5',
          DEFAULT: '#E53E3E', // Beautiful Crimson Red
          dark: '#9B2C2C',
          hover: '#C53030'
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.45)',
          whiteBorder: 'rgba(255, 255, 255, 0.3)',
          dark: 'rgba(26, 26, 36, 0.65)',
          darkBorder: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'premium': '0 8px 32px 0 rgba(148, 163, 184, 0.12)',
        'premium-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-red': '0 0 15px rgba(229, 62, 62, 0.3)',
      }
    },
  },
  plugins: [],
}
