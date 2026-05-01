/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

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

// After build, enumerate every emitted JS/CSS asset under dist/assets/ and
// inject the list (plus a per-build cache id) into dist/sw.js. Includes lazy
// chunks that index.html never references statically, so a cold offline reload
// actually has every bundle the app might dynamic-import.
function injectSwPrecacheManifest(): Plugin {
  return {
    name: 'inject-sw-precache-manifest',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const swPath = path.join(distDir, 'sw.js');
      const assetsDir = path.join(distDir, 'assets');
      if (!fs.existsSync(swPath) || !fs.existsSync(assetsDir)) return;

      const manifest: string[] = [];
      for (const entry of fs.readdirSync(assetsDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        if (!/\.(?:js|css)$/.test(entry.name)) continue;
        manifest.push('./assets/' + entry.name);
      }
      manifest.sort();

      const buildId = Date.now().toString(36);
      const sw = fs.readFileSync(swPath, 'utf8');
      const injected =
        `self.__SW_BUILD_ID__ = ${JSON.stringify(buildId)};\n` +
        `self.__SW_PRECACHE_MANIFEST__ = ${JSON.stringify(manifest)};\n` +
        sw;
      fs.writeFileSync(swPath, injected);
    },
  };
}

export default defineConfig({
  plugins: [react(), tightenProductionCsp(), injectSwPrecacheManifest()],
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
