import { expect, type Page } from "@playwright/test";

/** Tài khoản E2E (chỉ dùng cho database dev/test). */
export const E2E_ADMIN = {
  email: process.env.E2E_EMAIL ?? "e2e-admin@toannx.local",
  password: process.env.E2E_PASSWORD ?? "E2e-Strong-Passw0rd!",
};

/**
 * Đăng nhập qua giao diện tiếng Việt.
 *
 * @param page - Trang Playwright.
 * @param credentials - Thông tin đăng nhập.
 */
export async function loginViaUi(page: Page, credentials = E2E_ADMIN) {
  await page.goto("/vi/dang-nhap");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/vi\/quan-tri$/);
}
