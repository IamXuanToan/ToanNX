import { expect, test } from "@playwright/test";

import { E2E_ADMIN } from "./helpers";

test.describe("Bảo vệ route quản trị", () => {
  test("chưa đăng nhập bị chuyển tới trang đăng nhập kèm next, đăng nhập xong quay lại", async ({
    page,
  }) => {
    await page.goto("/vi/quan-tri/nguoi-dung");
    await expect(page).toHaveURL(/\/vi\/dang-nhap\?next=%2Fvi%2Fquan-tri%2Fnguoi-dung/);
    await page.getByLabel("Email hoặc tên người dùng").fill(E2E_ADMIN.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/nguoi-dung$/);
    await expect(page.getByRole("heading", { name: "Người dùng" })).toBeVisible();
  });

  test("cookie gợi ý phiên giả không vượt qua được backend", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "session_hint", value: "1", url: baseURL ?? "http://localhost:3001" },
    ]);
    await page.goto("/vi/quan-tri");
    // Proxy cho qua (kiểm tra lạc quan) nhưng backend từ chối → về trang đăng nhập.
    await expect(page).toHaveURL(/\/vi\/dang-nhap/);
  });

  test("API quản trị trả 401 khi không có phiên", async ({ request }) => {
    const response = await request.get("/api/v1/account/users");
    expect(response.status()).toBe(401);
    expect((await response.json()).error.code).toBe("AUTH_NOT_AUTHENTICATED");
  });
});
