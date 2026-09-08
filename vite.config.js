import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        //target: 'http://localhost:5001',
        target: 'https://synora-backend-pos-production.up.railway.app',
        changeOrigin: true,
      },
    },
  },
});
