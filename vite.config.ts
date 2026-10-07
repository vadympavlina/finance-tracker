import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base so the build works on any GitHub Pages path
// (https://<user>.github.io/<repo>/) and when opened from a sub-folder.
// Routing uses HashRouter, so page refreshes never hit a 404.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
  test: {
    environment: 'node',
  },
})
