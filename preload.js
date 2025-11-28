/*
 * PRELOAD.JS — Electron Isolated Bridge
 *
 * With contextIsolation enabled, the renderer cannot access Node.
 * This preload exposes only safe, intentional APIs.
 *
 * Browser version: does nothing.
 * Electron version: sets up window.api if needed.
 */

const { contextBridge } =
  (() => { try { return require("electron"); } catch { return {}; } })();

// In browser mode, contextBridge is undefined and we simply skip.
if (contextBridge && contextBridge.exposeInMainWorld) {
  contextBridge.exposeInMainWorld("api", {
    ping: () => "pong",
    version: "desktop"
  });
} else {
  // Browser fallback
  window.api = {
    ping: () => "pong",
    version: "browser"
  };
}
