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

  test("link rút gọn mở trang trung gian trước URL đích", async ({ page }) => {
    const slug = `e2e-${Date.now()}`;
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/link-rut-gon/tao-moi");
    await page.getByLabel("Tên", { exact: true }).fill(`Link ${slug}`);
    await page.getByLabel("Slug", { exact: true }).fill(slug);
    await page.getByRole("textbox", { name: "URL đích" }).fill("https://example.com/e2e");
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/link-rut-gon\/[0-9a-f-]{36}$/);

    const response = await page.request.get(`/s/${slug}`, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["location"]).toBeUndefined();
    await page.goto(`/s/${slug}`);
    await expect(page.getByRole("heading", { name: "Chuyển hướng liên kết" })).toBeVisible();
    await expect(page.getByText("https://example.com/e2e")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mở URL đích" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Về trang chủ" })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );
    await page.getByTestId("language-switcher").click();
    await page.getByTestId("locale-en").click();
    await expect(page).toHaveURL(`/s/${slug}`);
    await expect(page.getByRole("heading", { name: "Link Redirection" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open destination" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();

    await page.goto(`/s/${slug}-missing`);
    await expect(page.getByText("Link not found")).toBeVisible();
  });

  test("UUID và mật khẩu trên trang trung gian", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/link-rut-gon/tao-moi");
    await page.getByLabel("Tên", { exact: true }).fill("Link có mật khẩu");
    await page.getByRole("button", { name: "Tạo UUID" }).click();
    const slug = await page.getByLabel("Slug", { exact: true }).inputValue();
    expect(slug).toMatch(/^[0-9a-f-]{36}$/);
    await page.getByRole("textbox", { name: "URL đích" }).fill("https://example.com/protected");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("easy-pass");
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/link-rut-gon\/[0-9a-f-]{36}$/);

    await page.goto(`/s/${slug}`);
    await expect(page.getByText("https://example.com/protected")).toHaveCount(0);
    await page.getByLabel("Nhập mật khẩu để tiếp tục").fill("wrong");
    await page.getByRole("button", { name: "Mở khóa" }).click();
    await expect(page.getByText("Mật khẩu không đúng.")).toBeVisible();
    await page.getByLabel("Nhập mật khẩu để tiếp tục").fill("easy-pass");
    await page.getByRole("button", { name: "Mở khóa" }).click();
    await expect(page.getByText("https://example.com/protected")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mở URL đích" })).toBeVisible();
  });

  test("tự mở URL đích sau số giây đã đặt", async ({ page }) => {
    const slug = `e2e-auto-${Date.now()}`;
    const destination = "https://example.com/shortlink-auto";
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/link-rut-gon/tao-moi");
    await page.getByLabel("Tên", { exact: true }).fill("Link tự mở");
    await page.getByLabel("Slug", { exact: true }).fill(slug);
    await page.getByRole("textbox", { name: "URL đích" }).fill(destination);
    await page.getByRole("radio", { name: /Tự chuyển sau một khoảng chờ/ }).click();
    await page.getByLabel("Tự chuyển sau (giây)").fill("2");
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/link-rut-gon\/[0-9a-f-]{36}$/);

    await page.route(destination, (route) => route.fulfill({ status: 200, body: "Đã tới đích" }));
    await page.goto(`/s/${slug}`);
    await expect(page.getByRole("button", { name: "Mở URL đích" })).toBeVisible();
    await expect(page).toHaveURL(destination, { timeout: 10_000 });
  });

  test("link hết hạn hiển thị thông báo tại URL ngắn", async ({ page }) => {
    const slug = `e2e-expired-${Date.now()}`;
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/link-rut-gon/tao-moi");
    await page.getByLabel("Tên", { exact: true }).fill("Link hết hạn");
    await page.getByLabel("Slug", { exact: true }).fill(slug);
    await page.getByRole("textbox", { name: "URL đích" }).fill("https://example.com/expired");
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/link-rut-gon\/[0-9a-f-]{36}$/);
    const id = new URL(page.url()).pathname.split("/").pop();
    const csrf = await page.request.get("/api/v1/auth/csrf");
    const token = (await csrf.json()).data.csrf_token as string;
    const update = await page.request.patch(`/api/v1/short_links/links/${id}`, {
      data: { expires_at: new Date(Date.now() + 3000).toISOString() },
      headers: { "X-CSRFToken": token },
    });
    expect(update.ok(), await update.text()).toBe(true);
    await page.waitForTimeout(3500);
    await page.goto(`/s/${slug}`);
    await expect(page.getByText("Liên kết đã hết hạn")).toBeVisible();
    await expect(page).toHaveURL(`/s/${slug}`);
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
