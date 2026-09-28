import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { SERVER_ORIGIN } from './server.config';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const serverUrl = `http://${env.SERVER_HOST}:${env.SERVER_PORT}`;
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
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
  };
});
