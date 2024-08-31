const { addDynamicIconSelectors } = require('@iconify/tailwind');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.jsx',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      keyframes: {
        rainbow: {
          '0%': { color: '#FF0000' },  // Red
          '16%': { color: '#FF7F00' },  // Orange
          '33%': { color: '#FFFF00' },  // Yellow
          '50%': { color: '#00FF00' },  // Green
          '66%': { color: '#0000FF' },  // Blue
          '83%': { color: '#4B0082' },  // Indigo
          '100%': { color: '#8B00FF' }  // Violet
        },
      },
      animation: {
        'rainbow': 'rainbow 2s infinite',
      },
    },
  },
  plugins: [
    addDynamicIconSelectors(),

    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.4)',
        },
        '.text-shadow-md': {
          textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '5px 5px 10px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
        '.text-shadow-FF9443': {
          textShadow: '0.07em 0.07em rgba(255, 149, 68, 1.0)',
        },
      };

      addUtilities(newUtilities);
    },
  ],
}
