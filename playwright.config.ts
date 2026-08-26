import { defineConfig, devices } from "@playwright/test";

/**
 * E2E suite runs against a production build in demo mode (deterministic,
 * no outbound network, no credentials). Run `npm run build` first.
 *
 * The chromium executable path can be overridden with PLAYWRIGHT_CHROMIUM
 * (used in sandboxed environments with a preinstalled browser).
 */

const executablePath = process.env.PLAYWRIGHT_CHROMIUM || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3181",
    trace: "retain-on-failure",
    // --no-sandbox: containerized CI runs as root; Chromium refuses its own
    // sandbox there. This applies to the test browser only.
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ["--no-sandbox"],
    },
    contextOptions: {},
  },
  webServer: {
    command: "npm start -- --port 3181",
    url: "http://localhost:3181",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DEMO_MODE: "1",
      DATABASE_PATH: "data/e2e-archive-lens.db",
      PORT: "3181",
    },
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      grepInvert: /@mobile/,
    },
    {
      // Chromium-based mobile profile (WebKit is not installed in CI).
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      grep: /@mobile/,
    },
  ],
});
