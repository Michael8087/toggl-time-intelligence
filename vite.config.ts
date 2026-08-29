import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Production is served from a GitHub Pages project path; dev runs at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/toggl-time-intelligence/' : '/',
  plugins: [react()],
  build: {
    // GitHub Pages has no SPA rewrite, so ship a 404 that boots the same app.
    rollupOptions: {},
  },
}))
