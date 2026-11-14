import { expect, test } from "@playwright/test";

import { E2E_ADMIN, loginViaUi } from "./helpers";

test.describe("Xác thực", () => {
  test("đăng nhập thành công vào dashboard", async ({ page }) => {
    await loginViaUi(page);
    await expect(page.getByTestId("admin-content")).toContainText("Xin chào");
    await expect(page.getByRole("link", { name: "Người dùng" }).first()).toBeVisible();
  });

  test("sai mật khẩu hiển thị lỗi, không rời trang", async ({ page }) => {
    await page.goto("/vi/dang-nhap");
    await page.getByLabel("Email").fill(E2E_ADMIN.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong-password-123");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page.getByTestId("login-form").getByRole("alert")).toContainText(
      "Email hoặc mật khẩu không đúng",
    );
    await expect(page).toHaveURL(/\/vi\/dang-nhap/);
  });

  test("validation phía client theo ngôn ngữ", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Please enter your email.")).toBeVisible();
  });

  test("đăng xuất xóa phiên và chặn quay lại admin", async ({ page, context }) => {
    await loginViaUi(page);
    await page.getByTestId("user-menu").click();
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/vi\/dang-nhap/);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === "toannx_refresh")).toBeUndefined();
    await page.goto("/vi/quan-tri");
    await expect(page).toHaveURL(/\/vi\/dang-nhap\?next=/);
  });

  test("silent refresh khi access token hết hạn", async ({ page, context }) => {
    await loginViaUi(page);
    // Mô phỏng access token hết hạn: xóa cookie access, giữ refresh.
    const remaining = (await context.cookies()).filter((cookie) => cookie.name !== "toannx_access");
    await context.clearCookies();
    await context.addCookies(remaining);
    const refresh = page.waitForResponse((response) =>
      response.url().endsWith("/api/v1/auth/refresh"),
    );
    await page.getByRole("link", { name: "Người dùng" }).first().click();
    expect((await refresh).status()).toBe(200);
    await expect(page.getByRole("table")).toContainText(E2E_ADMIN.email);
    expect((await context.cookies()).some((cookie) => cookie.name === "toannx_access")).toBe(true);
  });
});
