import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@componentes': path.resolve(__dirname, './src/renderer/componentes'),
      '@servicos': path.resolve(__dirname, './src/renderer/servicos'),
      '@tipos': path.resolve(__dirname, './src/renderer/tipos'),
      '@hooks': path.resolve(__dirname, './src/renderer/hooks'),
      '@utils': path.resolve(__dirname, './src/renderer/utils'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
