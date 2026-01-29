import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://monprojet-backend:8080',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
