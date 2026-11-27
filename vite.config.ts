import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // GitHub Pages: set base to repo name when deploying
  base: process.env['VITE_BASE_URL'] ?? '/',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Stable chunk names for bundle-size tracking
        manualChunks: {
          react: ['react', 'react-dom'],
          zod: ['zod'],
        },
      },
    },
  },
});
