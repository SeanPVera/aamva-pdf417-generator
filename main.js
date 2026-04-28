/*
 * MAIN.JS — Electron Entry Point
 * Launches the desktop version of the AAMVA PDF417 Generator.
 *
 * Safe defaults:
 *  - Disabled Node integration in renderer
 *  - Preload script with controlled context exposure
 *  - Single window
 */

const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      enableWebSQL: false
    }
  });

  // Deny every renderer-initiated permission request by default. The app
  // does not need geolocation, notifications, mic, etc. The webcam scanner
  // explicitly grants 'media' below when the user opens it.
  win.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "media") return callback(true);
    return callback(false);
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    // Vite builds into /dist
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // Block all new-window/popup attempts — this app has no need for them
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  // Prevent navigation away from the local app file
  win.webContents.on("will-navigate", (event, url) => {
    const isLocalUrl = url.includes('localhost:') || url.includes('file://');
    if (!isLocalUrl) {
      event.preventDefault();
      // Open external links in the system browser instead
      if (url.startsWith("https://") || url.startsWith("http://")) {
        shell.openExternal(url);
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
