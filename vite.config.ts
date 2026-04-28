/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// In production, drop dev-only WebSocket sources from connect-src so the CSP
// in index.html is as tight as the offline-first design allows.
function tightenProductionCsp(): Plugin {
  return {
    name: 'tighten-production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        /connect-src 'self' ws: wss:;/,
        "connect-src 'none';"
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tightenProductionCsp()],
  define: {
    // Allows `crypto-js` to fall back if global is missing
    'global': 'window'
  },
  base: './', // Important for Electron
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@aamva/core': path.resolve(__dirname, './src/core'),
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
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.changeset/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/core/**/*.ts'],
      exclude: [
        'src/core/index.ts',
        'src/core/conformance/**',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 85,
        statements: 85,
      },
    },
  },
});
