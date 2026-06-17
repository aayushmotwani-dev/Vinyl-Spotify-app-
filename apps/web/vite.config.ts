import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1'
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Use terser for slightly better minification
    minify: 'esbuild',
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group all vendor deps into a single chunk
            // This chunk rarely changes and gets cached long-term
            return 'vendor';
          }
        }
      }
    },
    // Generate source maps only for debugging, not in production
    sourcemap: false,
    // Inline small assets (< 8KB) to reduce HTTP requests
    assetsInlineLimit: 8192
  }
})
