import { expect, test } from "@playwright/test";

import { E2E_ADMIN, loginViaUi, openModule } from "./helpers";

test.describe("Xác thực", () => {
  test("đăng nhập thành công vào màn chọn module", async ({ page }) => {
    await loginViaUi(page);
    await expect(page.getByTestId("admin-content")).toContainText("Xin chào");
    // Hai nhóm: Hệ thống và Tiện ích.
    await expect(page.getByTestId("module-launcher").getByRole("link")).toHaveCount(2);
  });

  test("sai mật khẩu hiển thị lỗi, không rời trang", async ({ page }) => {
    await page.goto("/vi/dang-nhap");
    await page.getByLabel("Email hoặc tên người dùng").fill(E2E_ADMIN.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong-password-123");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByTestId("login-form").getByRole("alert")).toContainText(
      "Tài khoản hoặc mật khẩu không đúng",
    );
    await expect(page).toHaveURL(/\/vi\/dang-nhap/);
  });

  test("đăng nhập bằng tên người dùng; ô bắt buộc có dấu * đỏ", async ({
    page,
    browser,
    baseURL,
  }) => {
    const admin = await browser.newContext({ baseURL });
    const adminPage = await admin.newPage();
    await loginViaUi(adminPage);
    const csrf = await adminPage.request.get("/api/v1/system/auth/csrf");
    const token = (await csrf.json()).data.csrf_token as string;
    const username = `e2e_user_${Date.now()}`;
    const created = await adminPage.request.post("/api/v1/system/users", {
      data: {
        email: `${username}@toannx.local`,
        username,
        password: "E2e-Temp-Passw0rd!",
        is_active: true,
        is_staff: true,
      },
      headers: { "X-CSRFToken": token },
    });
    expect(created.ok(), await created.text()).toBe(true);
    const userId = ((await created.json()) as { data: { id: string } }).data.id;
    try {
      await page.goto("/vi/dang-nhap");
      await expect(page.getByTestId("login-form").locator("label + .text-destructive")).toHaveCount(
        2,
      );
      await loginViaUi(page, { email: username, password: "E2e-Temp-Passw0rd!" });
    } finally {
      await adminPage.request.delete(`/api/v1/system/users/${userId}`, {
        headers: { "X-CSRFToken": token },
      });
      await admin.close();
    }
  });

  test("validation phía client theo ngôn ngữ", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter your email or username.")).toBeVisible();
  });

  test("đăng xuất xóa phiên và chặn quay lại admin", async ({ page, context }) => {
    await loginViaUi(page);
    await page.getByTestId("user-menu").click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/vi\/dang-nhap/);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === "refresh_token")).toBeUndefined();
    await page.goto("/vi/quan-tri");
    await expect(page).toHaveURL(/\/vi\/dang-nhap\?next=/);
  });

  test("silent refresh khi access token hết hạn", async ({ page, context }) => {
    await loginViaUi(page);
    // Mô phỏng access token hết hạn: xóa cookie access, giữ refresh.
    const remaining = (await context.cookies()).filter((cookie) => cookie.name !== "access_token");
    await context.clearCookies();
    await context.addCookies(remaining);
    const refresh = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/system/auth/refresh"),
    );
    await openModule(page, "Hệ thống");
    expect((await refresh).status()).toBe(200);
    await expect(page.getByRole("table")).toContainText(E2E_ADMIN.email);
    expect((await context.cookies()).some((cookie) => cookie.name === "access_token")).toBe(true);
  });
});
