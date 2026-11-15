import { expect, test } from "@playwright/test";

import { E2E_ADMIN, loginViaUi, openModule } from "./helpers";

test.describe("Trang quản trị", () => {
  test("nhóm Hệ thống ở giữa màn, sidebar chia theo module, quay về màn chọn", async ({ page }) => {
    await loginViaUi(page);
    const launcher = page.getByTestId("module-launcher");
    await expect(launcher.getByRole("link")).toHaveCount(1);
    const systemCard = launcher.getByRole("link", { name: /Hệ thống/ });
    await expect(systemCard).toContainText("Tài khoản");
    await expect(systemCard).toContainText("Phân quyền");

    await openModule(page, "Hệ thống");
    await expect(page).toHaveURL(/\/vi\/quan-tri\/nguoi-dung$/);
    const sidebar = page.locator("[data-slot=sidebar]");
    await expect(sidebar.getByTestId("module-switcher")).toContainText("Hệ thống");
    await expect(sidebar.getByTestId("sidebar-module-account")).toContainText("Người dùng");
    await expect(sidebar.getByTestId("sidebar-module-account")).toContainText("Phiên");
    await expect(sidebar.getByTestId("sidebar-module-iam")).toContainText("Vai trò");
    await expect(sidebar.getByTestId("sidebar-module-iam")).toContainText("Quyền");

    await sidebar.getByRole("link", { name: "Vai trò" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/vai-tro$/);

    await sidebar.getByTestId("module-switcher").click();
    await page.getByRole("menuitem", { name: "Tất cả module" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri$/);
    await expect(launcher).toBeVisible();

    // Nút quay lại trên header của module về màn chọn module.
    await openModule(page, "Hệ thống");
    await page.getByTestId("back-to-modules").click();
    await expect(page).toHaveURL(/\/vi\/quan-tri$/);
  });

  test("người dùng (Account) + vai trò (IAM) trên trang chi tiết", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/nguoi-dung");
    await page.getByPlaceholder("Tìm theo email, tên…").fill(E2E_ADMIN.email);
    await page.getByPlaceholder("Tìm theo email, tên…").press("Enter");
    await page.getByRole("link", { name: E2E_ADMIN.email }).first().click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/nguoi-dung\/[0-9a-f-]{36}$/);
    // Chi tiết dùng đúng form của trang tạo, thêm card Hoạt động; có nút quay lại danh sách.
    for (const heading of ["Thông tin tài khoản", "Truy cập", "Vai trò", "Hoạt động"]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByText("Đang trực tuyến").first()).toBeVisible();
    // Không có nút ← trong form (đã có Hủy); thanh nút nằm trong card đầu trang.
    await expect(page.getByTestId("page-back")).toHaveCount(0);
    await expect(page.getByTestId("form-actions")).toBeInViewport();
    await expect(page.getByText("Vai trò", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Superuser có toàn quyền; vai trò không ảnh hưởng.")).toBeVisible();
  });

  test("tạo người dùng là trang riêng, không popup; Hủy quay về danh sách", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/nguoi-dung");
    await page.getByRole("link", { name: "Tạo người dùng" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/nguoi-dung\/tao-moi$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page.getByText("Email không hợp lệ.")).toBeVisible();

    await page.getByRole("link", { name: "Hủy" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/nguoi-dung$/);
  });

  test("tạo vai trò là trang riêng, không popup", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/vai-tro");
    await page.getByRole("link", { name: "Tạo vai trò" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/vai-tro\/tao-moi$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByLabel("Mã vai trò")).toBeVisible();
  });
  test("tạo người dùng đủ trường, chọn vai trò ngay trong form; vai trò được gán sau khi tạo", async ({
    page,
  }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/nguoi-dung/tao-moi");
    // Bố cục: một card thông tin + cột phụ (truy cập, vai trò); thanh nút dính đáy luôn trong khung nhìn.
    for (const heading of ["Thông tin tài khoản", "Truy cập", "Vai trò"]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Hoạt động", exact: true })).toHaveCount(0);
    await expect(page.getByTestId("form-actions")).toBeInViewport();
    await page.getByRole("button", { name: "Chọn tất cả", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "Người xem", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Bỏ chọn", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "Người xem", exact: true })).not.toBeChecked();
    const email = `e2e-create-${Date.now()}@toannx.local`;
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Tên người dùng").fill(`e2e_${Date.now()}`);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-Temp-Passw0rd!");
    await page.getByLabel("Họ", { exact: true }).fill("Nguyễn");
    await page.getByLabel("Tên", { exact: true }).fill("Kiểm Thử");
    // Vai trò hiện hết dạng danh sách, tick để chọn.
    await page.getByRole("checkbox", { name: "Người xem", exact: true }).check();
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/nguoi-dung\/[0-9a-f-]{36}$/);
    const id = page.url().split("/").pop() ?? "";
    try {
      const viewer = page.getByRole("checkbox", { name: "Người xem", exact: true });
      await expect(viewer).toBeChecked();
      // Sửa vai trò cũng lưu bằng nút Lưu (giống form tạo).
      const save = page.getByRole("button", { name: "Lưu", exact: true });
      await expect(save).toBeDisabled();
      await viewer.uncheck();
      await expect(save).toBeEnabled();
      await expect(page.getByText("Có thay đổi chưa lưu")).toBeVisible();
      await save.click();
      await expect(page.getByText("Có thay đổi chưa lưu")).toHaveCount(0);
      await expect(save).toBeDisabled();
      await page.reload();
      await expect(
        page.getByRole("checkbox", { name: "Người xem", exact: true }),
      ).not.toBeChecked();
    } finally {
      const csrf = await page.request.get("/api/v1/auth/csrf");
      const token = (await csrf.json()).data.csrf_token as string;
      await page.request.delete(`/api/v1/account/users/${id}`, {
        headers: { "X-CSRFToken": token },
      });
    }
  });
  test("tạo vai trò chọn quyền ngay trong form; chi tiết hiện quyền theo module như trang Quyền", async ({
    page,
  }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/vai-tro/tao-moi");
    const code = `E2E_PICK_${Date.now()}`;
    await page.getByLabel("Mã vai trò").fill(code);
    await page.getByLabel("Tên vai trò").fill(`Vai trò ${code}`);
    await page.getByRole("checkbox", { name: "Xem người dùng", exact: true }).check();
    await page.getByRole("checkbox", { name: "Xem vai trò", exact: true }).check();
    await expect(page.getByText("Đã chọn 2 quyền.", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/vai-tro\/[0-9a-f-]{36}$/);
    const id = page.url().split("/").pop() ?? "";
    try {
      // Chi tiết dùng đúng form tạo: accordion theo module, card có checkbox, đầu module đã chọn / tổng.
      await expect(
        page.getByRole("checkbox", { name: "Xem người dùng", exact: true }),
      ).toBeChecked();
      await expect(page.getByRole("checkbox", { name: "Xem vai trò", exact: true })).toBeChecked();
      await expect(
        page.getByRole("checkbox", { name: "Tạo vai trò", exact: true }),
      ).not.toBeChecked();
      const accountModule = page
        .getByTestId("admin-content")
        .getByRole("button", { name: /^Tài khoản 1\// });
      await expect(accountModule).toHaveAttribute("aria-expanded", "true");
    } finally {
      const csrf = await page.request.get("/api/v1/auth/csrf");
      const token = (await csrf.json()).data.csrf_token as string;
      await page.request.delete(`/api/v1/iam/roles/${id}`, { headers: { "X-CSRFToken": token } });
    }
  });
});
