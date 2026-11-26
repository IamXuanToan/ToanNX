import { expect, type Page, test } from "@playwright/test";

import { loginViaUi, openModule } from "./helpers";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("Responsive", () => {
  test("màn System và form dùng chung không tràn ngang ở các mốc màn hình", async ({ page }) => {
    test.setTimeout(120_000);
    await loginViaUi(page);
    for (const width of [375, 768, 1024, 1280, 1366, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "nguoi-dung",
        "phien",
        "vai-tro",
        "quyen",
        "nguoi-dung/tao-moi",
        "vai-tro/tao-moi",
      ]) {
        await page.goto(`/vi/quan-tri/${path}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        if (width < 640 && !path.includes("/")) {
          // Ô tìm chính đứng đầu; nhóm quyền dài có thể có ô tìm nội bộ riêng.
          const search = page.getByRole("searchbox").first();
          await expect(search).toBeVisible();
          const bounds = await search.boundingBox();
          expect(bounds?.width).toBeGreaterThanOrEqual(width - 80);
        }
        await expectNoHorizontalScroll(page);
      }
    }
  });
  test("form đăng nhập vừa màn hình", async ({ page }) => {
    await page.goto("/vi/dang-nhap");
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("màn chọn module và sidebar module dạng drawer trên mobile, không tràn ngang", async ({
    page,
  }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri");
    await expect(page.getByTestId("module-launcher")).toBeVisible();
    await expectNoHorizontalScroll(page);
    await openModule(page, "Hệ thống");
    await expect(page).toHaveURL(/\/vi\/quan-tri\/he-thong\/nguoi-dung$/);
    await expectNoHorizontalScroll(page);
    await expect(page.getByRole("dialog")).toHaveCount(0); // drawer sidebar đang đóng
    await page.getByRole("button", { name: /toggle sidebar/i }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("link", { name: "Người dùng" })).toBeVisible();
    await expect(drawer.getByTestId("module-switcher")).toContainText("Hệ thống");
  });

  test("bảng người dùng trên mobile: mỗi dòng một card, không tràn ngang", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    const table = page.getByRole("table");
    // Đợi dòng dữ liệu thật (dòng khung chờ không có link).
    await expect(table.getByRole("link").first()).toBeVisible();
    await expect(table.locator("thead")).toBeHidden();
    const display = await table
      .locator("tbody tr")
      .first()
      .evaluate((row) => getComputedStyle(row).display);
    expect(display).toBe("grid");
    await expectNoHorizontalScroll(page);
  });
});
