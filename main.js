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
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile("index.html");

  // Block all new-window/popup attempts — this app has no need for them
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  // Prevent navigation away from the local app file
  win.webContents.on("will-navigate", (event, url) => {
    const appUrl = new URL(`file://${path.resolve(__dirname, "index.html")}`).href;
    if (url !== appUrl) {
      event.preventDefault();
      // Open external links in the system browser instead
      if (url.startsWith("https://") || url.startsWith("http://")) {
        shell.openExternal(url);
      }
    }
  });

  // Uncomment if you want devtools by default
  // win.webContents.openDevTools();
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
