import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  base: './',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}); 