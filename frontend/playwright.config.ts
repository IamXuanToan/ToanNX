import { defineConfig, devices } from "@playwright/test";

import { E2E_ADMIN } from "./tests/e2e/helpers";

/** Cổng riêng của E2E: không dùng nhầm server dev đang chạy ở 3001/8001. */
const BACKEND_PORT = 8002;
const FRONTEND_PORT = 3002;
const BACKEND_ORIGIN = `http://localhost:${BACKEND_PORT}`;

/**
 * E2E chạy trên frontend (bản build production) + backend Django thật với **database riêng** `toannx_e2e`
 * (`prepare_e2e` tạo database, migrate và superuser E2E trước khi chạy server), không đụng dữ liệu dev.
 * Frontend build vào `.next-e2e` để không ghi đè bản build thường.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /responsive.spec.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: [
    {
      command: `uv run python manage.py prepare_e2e && uv run python manage.py runserver ${BACKEND_PORT} --noreload`,
      cwd: "../backend",
      url: `${BACKEND_ORIGIN}/api/v1/health`,
      env: {
        DB_NAME: process.env.E2E_DB_NAME ?? "toannx_e2e",
        DJANGO_DEBUG: "True",
        E2E_EMAIL: E2E_ADMIN.email,
        E2E_PASSWORD: E2E_ADMIN.password,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm build && pnpm start -p ${FRONTEND_PORT}`,
      url: `http://localhost:${FRONTEND_PORT}/api/v1/health`,
      // `next build` cần NODE_ENV chuẩn; môi trường của test runner có thể khác.
      env: { NODE_ENV: "production", NEXT_DIST_DIR: ".next-e2e", BACKEND_ORIGIN },
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
});
