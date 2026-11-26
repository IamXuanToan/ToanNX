import { expect, test } from "@playwright/test";

import { E2E_ADMIN } from "./helpers";

const BACKEND_API = process.env.E2E_API_URL ?? "http://localhost:8002";

test.describe("Bảo vệ route quản trị", () => {
  test("chưa đăng nhập bị chuyển tới trang đăng nhập kèm next, đăng nhập xong quay lại", async ({
    page,
  }) => {
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    await expect(page).toHaveURL(/\/vi\/dang-nhap\?next=%2Fvi%2Fquan-tri%2Fhe-thong%2Fnguoi-dung/);
    await page.getByLabel("Email hoặc tên đăng nhập").fill(E2E_ADMIN.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(E2E_ADMIN.password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/he-thong\/nguoi-dung$/);
    await expect(page.getByRole("heading", { name: "Người dùng" })).toBeVisible();
  });

  test("cookie gợi ý phiên giả không vượt qua được backend", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "session_hint", value: "1", url: baseURL ?? "http://localhost:3002" },
    ]);
    await page.goto("/vi/quan-tri");
    // Proxy cho qua (kiểm tra lạc quan) nhưng backend từ chối → về trang đăng nhập.
    await expect(page).toHaveURL(/\/vi\/dang-nhap/);
  });

  test("API quản trị trả 401 khi không có phiên", async ({ request }) => {
    const response = await request.get(`${BACKEND_API}/api/v1/system/users`);
    expect(response.status()).toBe(401);
    expect((await response.json()).error.code).toBe("AUTH_NOT_AUTHENTICATED");
  });
});
