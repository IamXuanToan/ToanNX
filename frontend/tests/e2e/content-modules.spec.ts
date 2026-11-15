import { expect, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

test.describe("Nhóm Nội dung", () => {
  test("các trang danh sách mở được, không lỗi", async ({ page }) => {
    await loginViaUi(page);
    const pages: Array<[string, string]> = [
      ["/vi/quan-tri/link-rut-gon", "Link rút gọn"],
      ["/vi/quan-tri/ma-qr", "Mã QR"],
      ["/vi/quan-tri/trang", "Trang"],
      ["/vi/quan-tri/duong-dan", "Đường dẫn giữa"],
      ["/vi/quan-tri/nhat-ky", "Nhật ký thay đổi"],
    ];
    for (const [url, title] of pages) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    }
  });

  test("tạo link rút gọn rồi /s/{slug} chuyển hướng tới URL đích", async ({ page }) => {
    const slug = `e2e-${Date.now()}`;
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/link-rut-gon/tao-moi");
    await page.getByLabel("Tên", { exact: true }).fill(`Link ${slug}`);
    await page.getByLabel("Slug", { exact: true }).fill(slug);
    await page.getByRole("textbox", { name: "URL đích" }).fill("https://example.com/e2e");
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/link-rut-gon\/[0-9a-f-]{36}$/);

    const response = await page.request.get(`/s/${slug}`, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toBe("https://example.com/e2e");

    const missing = await page.request.get(`/s/${slug}-missing`, { maxRedirects: 0 });
    expect(missing.status()).toBe(302);
    expect(missing.headers()["location"]).toContain("reason=not-found");
  });

  test("nhật ký: sửa link hiện field cũ → mới, xem chi tiết từng giá trị", async ({ page }) => {
    const slug = `e2e-journal-${Date.now()}`;
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/link-rut-gon/tao-moi");
    await page.getByLabel("Tên", { exact: true }).fill("Tên cũ");
    await page.getByLabel("Slug", { exact: true }).fill(slug);
    await page.getByRole("textbox", { name: "URL đích" }).fill("https://example.com/journal");
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/link-rut-gon\/[0-9a-f-]{36}$/);
    await page.getByLabel("Tên", { exact: true }).fill("Tên mới");
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Tên mới").first()).toBeVisible();

    const id = new URL(page.url()).pathname.split("/").pop() ?? "";
    await page.goto(`/vi/quan-tri/nhat-ky?search=${id}`);
    const row = page.getByRole("row").filter({ hasText: "Tên cũ" }).filter({ hasText: "Tên mới" });
    await expect(row).toContainText("Tên cũ");
    await expect(row).toContainText("Tên mới");
    await row.getByRole("button", { name: "Xem chi tiết" }).click();

    await expect(page).toHaveURL(/\/vi\/quan-tri\/nhat-ky\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name: "Chi tiết thay đổi" })).toBeVisible();
    const change = page.getByRole("row").filter({ hasText: "name" });
    await expect(change).toContainText("Tên cũ");
    await expect(change).toContainText("Tên mới");
  });
});
