let preset;

try {
  preset = require('./shared-theme/tailwind-preset.js');
} catch (err) {
  try {
    preset = require('shared-theme/tailwind-preset');
  } catch (err2) {
    preset = undefined;
  }
}

/** @type {import('tailwindcss').Config} */
const baseConfig = {
  darkMode: 'class',
  presets: preset ? [preset] : [],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        slate: {
          950: '#0b0f19',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(245, 158, 11, 0.15)',
      },
    },
  },
  plugins: [],
};

module.exports = baseConfig;
