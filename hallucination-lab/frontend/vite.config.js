import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The proxy setting below only affects `npm run dev`. In production the
// static build calls the lab proxy at the path set in src/lib/api.js
// (default: same origin, /api).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8100',
        changeOrigin: true,
      },
    },
  },
})
