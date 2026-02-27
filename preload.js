/*
 * PRELOAD.JS — Electron Isolated Bridge
 *
 * With contextIsolation enabled, the renderer cannot access Node.
 * This preload exposes only safe, intentional APIs.
 *
 * Browser version: does nothing.
 * Electron version: sets up window.api if needed.
 */

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ping: () => "pong",
  version: "desktop"
});
