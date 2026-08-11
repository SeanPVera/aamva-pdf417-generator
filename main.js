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
const { isInternalUrl, isWebUrl } = require("./electron/urlPolicy");

const DEV_SERVER_ORIGIN = "http://localhost:3000";

// Hand a URL to the OS browser, but only for real web schemes. Passing
// arbitrary schemes to shell.openExternal can invoke other local handlers.
function openExternalIfWeb(rawUrl) {
  if (isWebUrl(rawUrl)) {
    shell.openExternal(rawUrl);
  }
}

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

  // Deny every renderer-initiated permission request by default. The app does
  // not need geolocation, notifications, clipboard-read, etc.
  //
  // 'media' is the one exception, because the webcam scanner needs it. It is
  // granted whenever the app asks — the renderer is the only thing that can ask
  // (see the will-navigate guard below, which keeps the window on app files) and
  // Chromium only surfaces the request when getUserMedia is actually called.
  win.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    return callback(permission === "media");
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    // Vite builds into /dist
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // Block all new-window/popup attempts — this app has no need for them.
  // Web links still reach the user, just in their own browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternalIfWeb(url);
    return { action: "deny" };
  });

  // Prevent navigation away from the local app
  win.webContents.on("will-navigate", (event, url) => {
    const internal = isInternalUrl(url, {
      appDir: __dirname,
      devServerOrigin: DEV_SERVER_ORIGIN,
      isDev
    });
    if (internal) return;
    event.preventDefault();
    // Open external links in the system browser instead
    openExternalIfWeb(url);
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
