import { expect, test } from "@playwright/test";

import { E2E_ADMIN, loginViaUi } from "./helpers";

test.describe("Trang quản trị", () => {
  test("người dùng (Account) + vai trò (IAM) trên trang chi tiết", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/nguoi-dung");
    await page.getByPlaceholder("Tìm theo email, tên...").fill(E2E_ADMIN.email);
    await page.getByRole("link", { name: E2E_ADMIN.email }).first().click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/nguoi-dung\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Thông tin tài khoản")).toBeVisible();
    await expect(page.getByText("Vai trò", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Superuser có toàn quyền; vai trò không ảnh hưởng.")).toBeVisible();
  });

  test("đổi icon module bằng tên lucide rồi trả về mặc định", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/module");
    await page.getByRole("button", { name: "Đổi icon module IAM" }).click();
    const dialog = page.getByRole("dialog");
    const input = dialog.getByLabel("Icon lucide-react");

    await input.fill("khong-co-icon-nay");
    await expect(dialog.getByText("Không có icon lucide với tên này.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Lưu" })).toBeDisabled();

    await input.fill("lock-keyhole");
    await dialog.getByRole("button", { name: "Lưu" }).click();
    await expect(dialog.getByText("Đang dùng icon lucide: lock-keyhole")).toBeVisible();

    await input.fill("");
    await dialog.getByRole("button", { name: "Lưu" }).click();
    await expect(dialog.getByText("Đang dùng icon lucide: shield-check")).toBeVisible();
  });
});
