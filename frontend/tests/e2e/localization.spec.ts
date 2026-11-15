import { expect, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

test.describe("Đa ngôn ngữ", () => {
  test("route Quyền và Phiên chuyển sang tiếng Anh, giữ bộ lọc", async ({ page }) => {
    await loginViaUi(page);
    for (const route of [
      {
        vi: "quyen?module=account",
        en: /\/en\/admin\/permissions\?module=account$/,
        title: "Permissions",
      },
      { vi: "phien?status=ACTIVE", en: /\/en\/admin\/sessions\?status=ACTIVE$/, title: "Sessions" },
    ]) {
      await page.goto(`/vi/quan-tri/${route.vi}`);
      await page.getByTestId("language-switcher").click();
      await page.getByTestId("locale-en").click();
      await expect(page).toHaveURL(route.en);
      await expect(page.getByRole("heading", { name: route.title, exact: true })).toBeVisible();
    }
  });
  test("URL và nội dung theo ngôn ngữ", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.goto("/vi/dang-nhap");
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  });

  test("chuyển ngôn ngữ giữ route tương ứng và query", async ({ page }) => {
    await page.goto("/vi/dang-nhap?next=%2Fvi%2Fquan-tri");
    await page.getByTestId("language-switcher").click();
    await page.getByTestId("locale-en").click();
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fvi%2Fquan-tri$/);
  });

  test("chuyển ngôn ngữ trong admin giữ trang và phiên", async ({ page }) => {
    await loginViaUi(page);
    await page.getByTestId("module-launcher").getByRole("link", { name: "Hệ thống" }).click();
    await page.locator("[data-slot=sidebar]").getByRole("link", { name: "Vai trò" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/vai-tro$/);
    await page.getByTestId("language-switcher").click();
    await page.getByTestId("locale-en").click();
    await expect(page).toHaveURL(/\/en\/admin\/roles$/);
    await expect(page.getByRole("heading", { name: "Roles" })).toBeVisible();
  });
});
