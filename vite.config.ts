import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //base: './',
  base: '/Kittyzone/',  // 关键修改：设置为相对路径
  build: {
    outDir: 'dist',
  }
})