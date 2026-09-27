import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { SERVER_ORIGIN } from './server.config.js'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: SERVER_ORIGIN,
        changeOrigin: true,
      },
      '/auth': {
        target: SERVER_ORIGIN,
        changeOrigin: true,
      },
    },
  },
})
