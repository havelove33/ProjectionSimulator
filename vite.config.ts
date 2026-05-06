import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// GitHub Pages: https://havelove33.github.io/ProjectionSimulator/
// 따라서 production base는 '/ProjectionSimulator/'
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ProjectionSimulator/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
}));
