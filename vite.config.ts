/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    // Allows `crypto-js` to fall back if global is missing
    'global': 'window'
  },
  base: './', // Important for Electron
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("react-dom") || id.includes("react")) return "react";
          if (id.includes("@zxing/browser") || id.includes("@zxing/library")) return "scanner";
          if (id.includes("bwip-js")) return "barcode";
          if (id.includes("jspdf")) return "export";
          return undefined;
        }
      },
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
});
