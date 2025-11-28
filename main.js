// ============================================================
// Electron Main Process
// Boots the AAMVA PDF417 generator as a desktop application
// ============================================================

const { app, BrowserWindow } = require("electron");
const path = require("path");

// Create the main application window
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // optional, safe even if missing
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile("index.html");
}

// Boot sequence
app.whenReady().then(() => {
  createWindow();

  // macOS behavior: re-open window if dock icon pressed with no windows open
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit on all windows closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
