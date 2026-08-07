import { describe, it, expect } from "vitest";
import path from "path";
import { pathToFileURL } from "url";

// The Electron shell's navigation guard. Required rather than imported so the
// CommonJS module under electron/ is loaded exactly as main.js loads it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isInternalUrl, isWebUrl } = require("../../electron/urlPolicy.js");

const APP_DIR = path.resolve("/opt/app");
const DEV_ORIGIN = "http://localhost:3000";

const prod = { appDir: APP_DIR, devServerOrigin: DEV_ORIGIN, isDev: false };
const dev = { appDir: APP_DIR, devServerOrigin: DEV_ORIGIN, isDev: true };

describe("electron navigation policy", () => {
  describe("isInternalUrl", () => {
    it("allows the packaged app's own entry point", () => {
      const url = pathToFileURL(path.join(APP_DIR, "dist", "index.html")).href;
      expect(isInternalUrl(url, prod)).toBe(true);
    });

    it("allows the app directory itself", () => {
      expect(isInternalUrl(pathToFileURL(APP_DIR).href, prod)).toBe(true);
    });

    it("rejects file:// paths outside the app directory", () => {
      const outside = pathToFileURL("/etc/passwd").href;
      expect(isInternalUrl(outside, prod)).toBe(false);
    });

    it("rejects a sibling directory that merely shares the app dir prefix", () => {
      // /opt/app-evil must not pass a naive startsWith(appDir) check.
      const sibling = pathToFileURL(path.resolve("/opt/app-evil/index.html")).href;
      expect(isInternalUrl(sibling, prod)).toBe(false);
    });

    it("rejects remote origins", () => {
      expect(isInternalUrl("https://example.com/", prod)).toBe(false);
      expect(isInternalUrl("http://example.com/", prod)).toBe(false);
    });

    // These are the cases the previous `url.includes(...)` guard let through.
    it("rejects remote URLs that embed the dev host in a query string", () => {
      expect(isInternalUrl("https://example.com/?next=localhost:3000", prod)).toBe(false);
      expect(isInternalUrl("https://example.com/?next=localhost:3000", dev)).toBe(false);
    });

    it("rejects remote URLs that embed a file:// scheme in a fragment", () => {
      expect(isInternalUrl("https://example.com/#file://", prod)).toBe(false);
      expect(isInternalUrl("https://example.com/#file://", dev)).toBe(false);
    });

    it("rejects a hostname that merely contains the dev host", () => {
      expect(isInternalUrl("http://localhost:3000.example.com/", dev)).toBe(false);
    });

    it("allows the dev server origin only in development", () => {
      expect(isInternalUrl(`${DEV_ORIGIN}/index.html`, dev)).toBe(true);
      expect(isInternalUrl(`${DEV_ORIGIN}/index.html`, prod)).toBe(false);
    });

    it("rejects a different port on the dev host", () => {
      expect(isInternalUrl("http://localhost:9999/", dev)).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(isInternalUrl("not a url", prod)).toBe(false);
      expect(isInternalUrl("", prod)).toBe(false);
    });
  });

  describe("isWebUrl", () => {
    it("accepts http and https", () => {
      expect(isWebUrl("https://example.com")).toBe(true);
      expect(isWebUrl("http://example.com")).toBe(true);
    });

    it("rejects schemes that could reach other local handlers", () => {
      expect(isWebUrl("file:///etc/passwd")).toBe(false);
      expect(isWebUrl("javascript:alert(1)")).toBe(false);
      expect(isWebUrl("smb://share/x")).toBe(false);
      expect(isWebUrl("ms-msdt:/id")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(isWebUrl("nope")).toBe(false);
    });
  });
});
