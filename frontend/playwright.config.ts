import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;
const isCI = Boolean(process.env.CI);
/** Point at an already running app (local dev server or a deployment) instead of starting one. */
const externalBaseURL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: externalBaseURL ?? `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseURL
    ? undefined
    : {
        // CI runs `npm run build` first and tests the production server.
        command: isCI ? `npm run start -- --port ${PORT}` : `npm run dev -- --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
