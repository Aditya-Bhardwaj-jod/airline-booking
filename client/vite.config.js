import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev proxy: /api requests forwarded to backend on :5000
 * This avoids CORS issues during development — browser thinks
 * it's talking to same origin (:5173), Vite proxies to :5000.
 * In production, Nginx/Caddy does the same job.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
