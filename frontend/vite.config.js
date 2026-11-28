import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxy. Order matters: the more specific /api/injection first.
// - /api/injection/* -> injection backend on :8100, as /api/*
// - /api/*           -> live-feed backend on :8000, with /api removed
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/injection': {
        target: 'http://localhost:8100',
        rewrite: (path) => path.replace(/^\/api\/injection/, '/api'),
      },
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
