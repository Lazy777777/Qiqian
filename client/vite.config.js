import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

const API_TARGET = process.env.API_TARGET || 'http://127.0.0.1:3000'

export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/uploads': { target: API_TARGET, changeOrigin: true }
    }
  }
})
