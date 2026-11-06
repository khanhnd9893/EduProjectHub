import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/EduProjectHub/Code/Backend': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
})
