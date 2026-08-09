/*
 * URLPOLICY.JS — Navigation policy for the Electron shell.
 *
 * Kept in its own CommonJS module (rather than inline in main.js) so the rules
 * can be unit tested without booting Electron. main.js is the only consumer.
 */

const path = require("path");
const { fileURLToPath } = require("url");

/**
 * True only for URLs the app window is allowed to navigate to: its own
 * packaged files, and — in development — the Vite dev server origin.
 *
 * Substring matching is not sufficient here. URLs such as
 * `https://example.com/?next=localhost:` or `https://example.com/#file://`
 * satisfy a naive `includes()` check, which would let a renderer navigate
 * off-app and defeat the point of the guard.
 *
 * @param {string} rawUrl              URL the renderer wants to navigate to.
 * @param {object} options
 * @param {string} options.appDir      Directory the app's own files live in.
 * @param {string} options.devServerOrigin  Origin of the Vite dev server.
 * @param {boolean} options.isDev      Whether the dev server origin is allowed.
 */
function isInternalUrl(rawUrl, { appDir, devServerOrigin, isDev }) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol === "file:") {
    let filePath;
    try {
      filePath = fileURLToPath(parsed);
    } catch {
      return false;
    }
    // Constrain file:// navigation to the app directory so the renderer
    // cannot pull arbitrary local files into the window.
    const root = path.resolve(appDir);
    const resolved = path.resolve(filePath);
    return resolved === root || resolved.startsWith(root + path.sep);
  }

  return Boolean(isDev) && parsed.origin === devServerOrigin;
}

/**
 * True for plain web URLs. Used to decide what may be handed to
 * shell.openExternal — passing arbitrary schemes there can invoke unrelated
 * local protocol handlers.
 *
 * @param {string} rawUrl
 */
function isWebUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

module.exports = { isInternalUrl, isWebUrl };
