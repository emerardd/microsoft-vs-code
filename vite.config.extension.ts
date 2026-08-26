import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: path.resolve(__dirname, 'extension', 'media'),
    rollupOptions: {
      input: path.resolve(__dirname, 'extension', 'webview', 'index.tsx'),
      output: {
        assetFileNames: 'game.[ext]',
        entryFileNames: 'game.js',
        chunkFileNames: 'chunk-[name].js',
      },
    },
  },
});
