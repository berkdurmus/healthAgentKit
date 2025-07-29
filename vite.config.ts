import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './web',
  build: {
    outDir: '../dist-web',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './web/lib'),
      '@/components': path.resolve(__dirname, './web/components'),
      '@/hooks': path.resolve(__dirname, './web/hooks'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}) 