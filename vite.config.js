import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const port = Number(process.env.PORT) || 5174;
//const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:5001';
const apiTarget = 'https://synora-pos-backend-production-1fd4.up.railway.app' ||'http://localhost:5001'
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
        secure: false,
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
