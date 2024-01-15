import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import unocss from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), unocss()],
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, './src') }]
  }
})
