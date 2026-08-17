import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Regression-test the production CSP. We rebuild only when dist/ is missing so
// the test stays fast in dev; CI always runs after a fresh `npm run build`.
function ensureBuilt(distHtml: string): void {
  if (!existsSync(distHtml)) {
    execSync("npm run build", { stdio: "ignore" });
  }
}

describe("Production CSP", () => {
  const distHtml = resolve(__dirname, "../../dist/index.html");

  it("emits the tightened policy in dist/index.html", () => {
    ensureBuilt(distHtml);
    const html = readFileSync(distHtml, "utf8");
    const csp = html.match(
      /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i
    )?.[1];
    expect(csp, "CSP meta missing in dist/index.html").toBeTruthy();
    if (!csp) return;

    // Required directives: each must be present with the expected restrictive value.
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/script-src 'self'/);
    expect(csp).toMatch(/connect-src 'none'/); // dev allows ws:; prod must be locked.
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(csp).toMatch(/object-src 'none'/);
    expect(csp).toMatch(/base-uri 'self'/);
    expect(csp).toMatch(/form-action 'none'/);

    // Affirmatively forbidden: no inline scripts, no remote scripts, no eval.
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-eval'/);
    expect(csp).not.toMatch(/script-src[^;]*https:/);
  });

  it("does not upgrade insecure requests", () => {
    ensureBuilt(distHtml);
    const html = readFileSync(distHtml, "utf8");
    const csp = html.match(
      /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i
    )?.[1];

    // `upgrade-insecure-requests` rewrites http:// subresource requests to
    // https://. The spec exempts potentially-trustworthy origins, and Chromium
    // and Firefox honour that for http://localhost — WebKit does not. Served
    // over plain HTTP it therefore asks for https://localhost:4173/assets/*.js,
    // the server has no TLS, every asset fails, and React never mounts: a blank
    // page in Safari and on any LAN http:// origin, which is exactly how
    // `npm run dev:mobile` is meant to be used from a phone.
    //
    // It also buys nothing here. Every subresource is same-origin and relative
    // (this app makes no network requests at all), so on an https:// origin
    // they are already https. Removing it costs no protection that can apply.
    expect(csp).not.toMatch(/upgrade-insecure-requests/);
  });
});
