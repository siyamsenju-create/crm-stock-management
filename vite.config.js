import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Increase warning threshold so existing warning is suppressed (optional)
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Split vendor libraries into a stable, long-cacheable chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group React + React-DOM together
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Firebase in its own chunk
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            // Everything else from node_modules
            return 'vendor';
          }
        },
      },
    },
  },
})
