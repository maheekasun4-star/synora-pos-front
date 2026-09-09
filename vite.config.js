import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const port = Number(process.env.PORT) || 5174;

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port,
    proxy: {
      '/api': {
        target: 'https://synora-backend-pos-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    allowedHosts: [
      'synora-pos-frontend-production.up.railway.app',
      'synora-pos-frontend-production-83ef.up.railway.app',
    ],
  },
});
