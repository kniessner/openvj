import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('/three/build/') ||
            id.includes('/three/src/')
          ) {
            return 'three-core'
          }

          if (id.includes('/three-stdlib/')) {
            return 'three-stdlib'
          }

          if (
            id.includes('/@react-three/fiber/') ||
            id.includes('/@react-three/drei/') ||
            id.includes('/@react-spring/three/') ||
            id.includes('/camera-controls/')
          ) {
            return 'r3f-vendor'
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
