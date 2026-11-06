import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base:
    command === 'build'
      ? '/EduProjectHub/Code/frontend/dist/'
      : '/',
  plugins: [react()],
  server: {
    proxy: {
      '/EduProjectHub/Code/Backend': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
}))
