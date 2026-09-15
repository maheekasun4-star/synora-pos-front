import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const port = Number(process.env.PORT) || 5174;
// Dev proxy target. Defaults to the production Railway backend.
// Override with VITE_API_TARGET to target another host (e.g. a local backend
// on port 5001): VITE_API_TARGET=http://localhost:5001
const apiTarget = process.env.VITE_API_TARGET || 'https://synora-pos-backend-production-1fd4.up.railway.app';
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        // Use secure TLS verification for the production backend.
        secure: true,
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
