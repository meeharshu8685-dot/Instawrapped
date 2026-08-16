import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-muxer': ['mp4-muxer', 'webm-muxer'],
          'vendor-zip': ['jszip'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})
