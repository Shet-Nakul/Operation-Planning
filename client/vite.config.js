import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { SERVER_ORIGIN } from './server.config.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const serverUrl = `http://${env.SERVER_HOST}:${env.SERVER_PORT}`
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: serverUrl,
          changeOrigin: true,
        },
        '/auth': {
          target: serverUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
