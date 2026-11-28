import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server: /api/* is forwarded to the live-feed backend on :8000 with the
// /api prefix removed (the backend serves /stream, /ingest, /live/stats).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
