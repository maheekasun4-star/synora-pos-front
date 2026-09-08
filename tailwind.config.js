const path = require('path');
let preset;
// Try a few locations for the shared preset (monorepo relative path, package name).
try {
  //preset = require('../shared-theme/tailwind-preset.js');
   preset = require('../frontend/shared-theme/tailwind-preset.js');
} catch (err) {
  try {
    preset = require('shared-theme/tailwind-preset');
  } catch (err2) {
    // No shared preset available in this environment — continue without it.
    preset = undefined;
  }
}

/** @type {import('tailwindcss').Config} */
const baseConfig = {
  presets: preset ? [preset] : [],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    // Local overrides can go here; core tokens come from the shared preset.
    extend: {},
  },
  plugins: [],
};

// If the shared preset isn't available (e.g., building standalone), provide
// a small fallback palette for classes the app uses so PostCSS/@apply doesn't fail.
if (!preset) {
  baseConfig.theme.extend.colors = {
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1f2937',
      900: '#0f1724',
      950: '#020617',
    },
    amber: {
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
    },
  };
}

module.exports = baseConfig;
