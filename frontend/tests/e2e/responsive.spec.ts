import { expect, type Page, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("Responsive", () => {
  test("form đăng nhập vừa màn hình", async ({ page }) => {
    await page.goto("/vi/dang-nhap");
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("dashboard: sidebar dạng drawer trên mobile, không tràn ngang", async ({ page }) => {
    await loginViaUi(page);
    await expect(page.getByTestId("admin-content")).toBeVisible();
    await expectNoHorizontalScroll(page);
    const sidebarLink = page.getByRole("link", { name: "Người dùng" });
    await expect(sidebarLink).toHaveCount(1); // chỉ còn lối tắt trên dashboard; sidebar đang đóng
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    await expect(page.getByRole("dialog").getByRole("link", { name: "Người dùng" })).toBeVisible();
  });
});
