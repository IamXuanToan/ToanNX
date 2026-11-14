import { defineConfig, devices } from "@playwright/test";

/**
 * E2E chạy trên frontend (3000) + backend Django (8000) thật, database dev.
 * Nếu server đã chạy sẵn thì dùng lại; ngược lại Playwright tự khởi động.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive.spec.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "uv run python manage.py runserver 8000 --noreload",
      cwd: "../backend",
      url: "http://localhost:8000/api/v1/health",
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm start -p 3000",
      url: "http://localhost:3000/api/v1/health",
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
