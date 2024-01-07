import react from '@vitejs/plugin-react-swc'
import path from 'path'
import unocss from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), unocss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '/src')
    }
  }
})
