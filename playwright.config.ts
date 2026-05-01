import { defineConfig, devices, type Project } from "@playwright/test";

const PORT = 4173;

// Browser matrix: by default we only run Chromium so a fresh `npm run
// test:e2e` doesn't require every browser to be installed locally. CI
// shards across browsers via the `PW_BROWSERS` env var (a comma-separated
// list — `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`,
// or `all`).
const ALL_PROJECTS: Record<string, Project> = {
  chromium: {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] }
  },
  firefox: {
    name: "firefox",
    use: { ...devices["Desktop Firefox"] }
  },
  webkit: {
    name: "webkit",
    use: { ...devices["Desktop Safari"] }
  },
  "mobile-chrome": {
    name: "mobile-chrome",
    use: { ...devices["Pixel 5"] }
  },
  "mobile-safari": {
    name: "mobile-safari",
    use: { ...devices["iPhone 13"] }
  }
};

const requested = (process.env["PW_BROWSERS"] || "chromium")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const enabled = requested.includes("all") ? Object.keys(ALL_PROJECTS) : requested;
const projects = enabled
  .map((name) => ALL_PROJECTS[name])
  .filter((p): p is Project => Boolean(p));

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: projects.length > 0 ? projects : [ALL_PROJECTS.chromium!],
  webServer: {
    command: `npm run build && npm run serve -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000
  }
});
