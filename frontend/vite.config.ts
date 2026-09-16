import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/analyze': 'http://localhost:1342',
      '/download-report': 'http://localhost:1342',
    }
  }
})
