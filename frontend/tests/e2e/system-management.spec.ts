import { expect, type APIRequestContext, test } from "@playwright/test";

import { E2E_ADMIN, loginViaUi } from "./helpers";

/** Gửi thay đổi qua API thật với CSRF của đúng phiên kiểm thử. */
async function apiPost<T = unknown>(
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
): Promise<T> {
  const csrf = await request.get("/api/v1/system/auth/csrf");
  const token = (await csrf.json()).data.csrf_token as string;
  const response = await request.post(path, { data, headers: { "X-CSRFToken": token } });
  expect(response.ok(), await response.text()).toBe(true);
  const body: { data: T } = await response.json();
  return body.data;
}

/** Xóa dữ liệu kiểm thử do chính ca kiểm thử tạo. */
async function apiDelete(request: APIRequestContext, path: string) {
  const csrf = await request.get("/api/v1/system/auth/csrf");
  const token = (await csrf.json()).data.csrf_token as string;
  expect((await request.delete(path, { headers: { "X-CSRFToken": token } })).status()).toBe(204);
}

test.describe("Quản trị Hệ thống", () => {
  test("staff chỉ có quyền xem phiên: menu đúng, không có thu hồi và không vào được Quyền", async ({
    page,
    browser,
  }) => {
    await loginViaUi(page);
    const suffix = Date.now();
    const role = await apiPost<{ id: string }>(page.request, "/api/v1/system/roles", {
      code: `E2E_SESSION_READER_${suffix}`,
      name: "Session reader",
    });
    const staff = await apiPost<{ id: string; email: string }>(
      page.request,
      "/api/v1/system/users",
      {
        email: `e2e-session-reader-${suffix}@toannx.local`,
        username: `e2e-session-reader-${suffix}@toannx.local`.split("@")[0],
        password: "E2e-Temp-Passw0rd!",
        is_active: true,
        is_staff: true,
      },
    );
    const context = await browser.newContext({ baseURL: new URL(page.url()).origin });
    try {
      const response = await page.request.get(
        "/api/v1/system/permissions?search=system.session.read",
      );
      const permissions: { data: { id: string }[] } = await response.json();
      await apiPost(page.request, `/api/v1/system/roles/${role.id}/permissions`, {
        permission_id: permissions.data[0].id,
      });
      await apiPost(page.request, `/api/v1/system/users/${staff.id}/roles`, { role_id: role.id });
      const staffPage = await context.newPage();
      await loginViaUi(staffPage, { email: staff.email, password: "E2e-Temp-Passw0rd!" });
      await staffPage.goto("/vi/quan-tri");
      await staffPage
        .getByTestId("module-launcher")
        .getByRole("link", { name: /Hệ thống/ })
        .click();
      await expect(staffPage).toHaveURL(/\/quan-tri\/he-thong\/phien$/);
      await expect(staffPage.getByText("Phiên hiện tại", { exact: true })).toBeVisible();
      await expect(staffPage.getByTestId("sidebar-module-account").getByRole("link")).toHaveCount(
        1,
      );
      await expect(staffPage.getByTestId("sidebar-module-iam")).toHaveCount(0);
      await expect(
        staffPage.getByRole("table").getByRole("button", { name: "Thu hồi", exact: true }),
      ).toHaveCount(0);
      await expect(staffPage.getByRole("table").getByRole("checkbox")).toHaveCount(0);
      // Chỉ có quyền xem phiên vẫn lọc được người dùng, không cần đọc hồ sơ tài khoản.
      expect((await staffPage.request.get("/api/v1/system/users")).status()).toBe(403);
      const userFilter = staffPage.getByRole("button", { name: "Người dùng", exact: true });
      await userFilter.click();
      await staffPage
        .getByRole("option")
        .filter({ hasText: staff.email })
        .getByRole("checkbox")
        .click();
      await staffPage.keyboard.press("Escape");
      await expect(userFilter).toBeFocused();
      await expect(staffPage).toHaveURL(new RegExp(`user=${staff.id}`));
      await expect(staffPage.getByRole("table").locator("tbody tr")).toHaveCount(1);
      await expect(staffPage.getByRole("table")).toContainText(staff.email);
      await userFilter.click();
      await staffPage
        .getByRole("option")
        .filter({ hasText: E2E_ADMIN.email })
        .getByRole("checkbox")
        .click();
      await staffPage.keyboard.press("Escape");
      await expect(userFilter).toBeFocused();
      const selectedUsers = new URL(staffPage.url()).searchParams.get("user")?.split(",") ?? [];
      expect(selectedUsers).toHaveLength(2);
      await staffPage.reload();
      await expect(userFilter).toContainText("2");
      await userFilter.click();
      await expect(
        staffPage.getByRole("button", { name: "Chọn tất cả", exact: true }),
      ).toBeVisible();
      await staffPage.getByRole("button", { name: "Xoá lọc", exact: true }).click();
      await staffPage.keyboard.press("Escape");
      await expect(staffPage).not.toHaveURL(/user=/);
      await staffPage.goto("/vi/quan-tri/he-thong/quyen");
      await expect(staffPage.getByTestId("forbidden")).toBeVisible();
    } finally {
      await context.close();
      await apiDelete(page.request, `/api/v1/system/users/${staff.id}`);
      await apiDelete(page.request, `/api/v1/system/roles/${role.id}`);
    }
  });

  test("gõ chưa Enter không gọi tìm kiếm; bộ lọc và URL giữ nhau khi tải lại", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    await expect(page.getByRole("table").getByRole("link").first()).toBeVisible();
    const searches: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/v1/system/users" && url.searchParams.has("search"))
        searches.push(url.searchParams.get("search") ?? "");
    });
    await page.getByRole("searchbox").fill(E2E_ADMIN.email);
    // Chuyển focus/đổi bộ lọc vẫn không gửi từ khóa đang gõ.
    await page.getByRole("button", { name: "Trạng thái", exact: true }).click();
    await page.getByRole("option", { name: "Hoạt động", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/isActive=true/);
    expect(searches).toEqual([]);
    await page.getByRole("searchbox").press("Enter");
    await expect.poll(() => searches).toContain(E2E_ADMIN.email);
    await expect(page).toHaveURL(/search=/);
    await expect(page).toHaveURL(/isActive=true/);
    await page.reload();
    await expect(page.getByRole("searchbox")).toHaveValue(E2E_ADMIN.email);
    await expect(page.getByRole("button", { name: "Trạng thái", exact: true })).toContainText(
      "Hoạt động",
    );
    await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
    await expect(page).toHaveURL(/\/nguoi-dung$/);
  });

  test("lọc người dùng theo vai trò kết hợp trạng thái; tìm kiếm không xóa vai trò", async ({
    page,
  }) => {
    await loginViaUi(page);
    const suffix = Date.now();
    const role = await apiPost<{ id: string; name: string }>(page.request, "/api/v1/system/roles", {
      code: `E2E_FILTER_${suffix}`,
      name: `Vai trò lọc ${suffix}`,
    });
    const user = await apiPost<{ id: string; email: string }>(
      page.request,
      "/api/v1/system/users",
      {
        email: `e2e-filter-${suffix}@toannx.local`,
        username: `e2e-filter-${suffix}@toannx.local`.split("@")[0],
        password: "E2e-Temp-Passw0rd!",
        is_active: true,
      },
    );
    try {
      await apiPost(page.request, `/api/v1/system/users/${user.id}/roles`, { role_id: role.id });
      await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
      await page.getByRole("button", { name: "Vai trò", exact: true }).click();
      await page.getByRole("option", { name: new RegExp(role.name) }).click();
      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(new RegExp(`role=${role.id}`));
      const rows = page.getByRole("table").locator("tbody tr");
      await expect(rows).toHaveCount(1);
      await expect(rows.first()).toContainText(user.email);
      await page.getByRole("searchbox").fill(user.email);
      await page.getByRole("searchbox").press("Enter");
      await page.getByRole("button", { name: "Trạng thái", exact: true }).click();
      await page.getByRole("option", { name: "Đã khóa", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("data-table-empty")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`role=${role.id}`));
      await expect(page).toHaveURL(/search=/);
      await page.reload();
      await expect(page.getByRole("button", { name: "Vai trò", exact: true })).toContainText(
        role.name,
      );
    } finally {
      await apiDelete(page.request, `/api/v1/system/users/${user.id}`);
      await apiDelete(page.request, `/api/v1/system/roles/${role.id}`);
    }
  });

  test("vai trò có bộ lọc loại, trạng thái và chính sách tự cấp quyền", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/vai-tro");
    await page.getByRole("button", { name: "Loại vai trò", exact: true }).click();
    await page.getByRole("option", { name: "Hệ thống", exact: true }).click();
    await page.keyboard.press("Escape");
    // Radix trả focus về nút cũ sau khi đóng; chờ xong rồi mới mở bộ lọc kế tiếp.
    await expect(page.getByRole("button", { name: "Loại vai trò", exact: true })).toBeFocused();
    await expect(page).toHaveURL(/isSystem=true/);
    await page.getByRole("button", { name: "Chính sách tự cấp quyền", exact: true }).click();
    await page.getByRole("option", { name: "Tự cấp mọi quyền", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Chính sách tự cấp quyền", exact: true }),
    ).toBeFocused();
    await expect(page).toHaveURL(/autoGrant=all/);
    await page.getByRole("button", { name: "Trạng thái", exact: true }).click();
    await page.getByRole("option", { name: "Hoạt động", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/isSystem=true/);
    await expect(page).toHaveURL(/autoGrant=all/);
    await expect(page).toHaveURL(/isActive=true/);
    await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(1);
    await expect(page.getByRole("table")).toContainText("ADMIN");
    await page.reload();
    await expect(page.getByRole("button", { name: "Loại vai trò", exact: true })).toContainText(
      "Hệ thống",
    );
  });

  test("danh mục quyền chỉ đọc, nhóm theo module và tìm khi Enter", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/quyen");
    await expect(page.getByRole("heading", { name: "Quyền", exact: true })).toBeVisible();
    // Mỗi module một mục accordion, mặc định mở.
    const systemModule = page
      .getByTestId("admin-content")
      .getByRole("button", { name: /^Hệ thống/ });
    await expect(systemModule).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("system.session.read", { exact: true })).toBeVisible();
    await expect(page.getByTestId("admin-content").getByRole("checkbox")).toHaveCount(0);
    await expect(page.getByTestId("admin-content").getByRole("switch")).toHaveCount(0);
    await expect(page.getByTestId("admin-content").getByRole("link")).toHaveCount(0);
    // Thu gọn rồi mở lại một module.
    await systemModule.click();
    await expect(systemModule).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("system.user.read", { exact: true })).toHaveCount(0);
    await systemModule.click();
    const search = page.getByRole("searchbox", { name: "Tìm theo tên, mã, mô tả…", exact: true });
    await search.fill("system.session.read");
    await expect(page.getByText("system.user.read", { exact: true })).toBeVisible();
    await search.press("Enter");
    await expect(page.getByTestId("admin-content").locator("li")).toHaveCount(1);
    await expect(page.getByText("system.user.read", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Module", exact: true }).click();
    await page.getByRole("option", { name: "Tiện ích", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Không có quyền phù hợp.")).toBeVisible();
    await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
    await expect(page.getByText("system.user.read", { exact: true })).toBeVisible();
  });

  test("xem phiên của người khác, hủy xác nhận rồi thu hồi thực sự", async ({ page, browser }) => {
    await loginViaUi(page);
    const user = await apiPost<{ id: string; email: string }>(
      page.request,
      "/api/v1/system/users",
      {
        email: `e2e-session-${Date.now()}@toannx.local`,
        username: `e2e-session-${Date.now()}@toannx.local`.split("@")[0],
        password: "E2e-Temp-Passw0rd!",
        is_active: true,
      },
    );
    const target = await browser.newContext({ baseURL: new URL(page.url()).origin });
    try {
      await apiPost(target.request, "/api/v1/system/auth/login", {
        identifier: user.email,
        password: "E2e-Temp-Passw0rd!",
      });
      expect((await target.request.get("/api/v1/system/auth/me")).status()).toBe(200);
      await page.goto("/vi/quan-tri/he-thong/phien");
      await expect(page.getByText("Phiên hiện tại", { exact: true })).toBeVisible();
      await page.getByRole("searchbox").fill(user.email);
      await page.getByRole("searchbox").press("Enter");
      const row = page.getByRole("table").getByRole("row").filter({ hasText: user.email });
      await expect(row).toHaveCount(1);
      await row.getByRole("button", { name: "Thu hồi", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toContainText(user.email);
      await page.getByRole("button", { name: "Hủy", exact: true }).click();
      expect((await target.request.get("/api/v1/system/auth/me")).status()).toBe(200);
      await row.getByRole("button", { name: "Thu hồi", exact: true }).click();
      await page.getByTestId("confirm-dialog-confirm").click();
      await expect(row).toContainText("Đã thu hồi");
      await expect(row.getByRole("button", { name: "Thu hồi", exact: true })).toHaveCount(0);
      expect((await target.request.get("/api/v1/system/auth/me")).status()).toBe(401);
      await row.getByRole("button", { name: "Xoá", exact: true }).click();
      await page.getByTestId("confirm-dialog-confirm").click();
      await expect(row).toHaveCount(0);
      await page.reload();
      await expect(row).toHaveCount(0);
    } finally {
      await target.close();
      await apiDelete(page.request, `/api/v1/system/users/${user.id}`);
    }
  });
  test("chọn nhiều phiên rồi thu hồi hàng loạt; lọc nhiều trạng thái", async ({
    page,
    browser,
  }) => {
    await loginViaUi(page);
    const user = await apiPost<{ id: string; email: string }>(
      page.request,
      "/api/v1/system/users",
      {
        email: `e2e-bulk-session-${Date.now()}@toannx.local`,
        username: `e2e-bulk-session-${Date.now()}@toannx.local`.split("@")[0],
        password: "E2e-Temp-Passw0rd!",
        is_active: true,
      },
    );
    const origin = new URL(page.url()).origin;
    const devices = [
      await browser.newContext({ baseURL: origin }),
      await browser.newContext({ baseURL: origin }),
    ];
    try {
      for (const device of devices) {
        await apiPost(device.request, "/api/v1/system/auth/login", {
          identifier: user.email,
          password: "E2e-Temp-Passw0rd!",
        });
      }
      await page.goto("/vi/quan-tri/he-thong/phien");
      await page.getByRole("searchbox").fill(user.email);
      await page.getByRole("searchbox").press("Enter");
      const rows = page.getByRole("table").getByRole("row").filter({ hasText: user.email });
      await expect(rows).toHaveCount(2);
      await page.getByRole("checkbox", { name: "Chọn tất cả dòng trong trang" }).check();
      const bulkBar = page.getByTestId("table-bulk-bar");
      await expect(bulkBar).toContainText("Đã chọn 2");
      await bulkBar.getByRole("button", { name: "Thu hồi đã chọn" }).click();
      await expect(page.getByRole("alertdialog")).toContainText("Thu hồi 2 phiên?");
      await page.getByTestId("confirm-dialog-confirm").click();
      await expect(rows.first()).toContainText("Đã thu hồi");
      await expect(rows.nth(1)).toContainText("Đã thu hồi");
      for (const device of devices) {
        expect((await device.request.get("/api/v1/system/auth/me")).status()).toBe(401);
      }
      // Lọc nhiều trạng thái cùng lúc.
      await page.getByRole("button", { name: "Trạng thái", exact: true }).click();
      await page.getByRole("option", { name: "Đang hoạt động", exact: true }).click();
      await page.getByRole("option", { name: "Đã thu hồi", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(/status=ACTIVE(%2C|,)REVOKED/);
      await expect(rows).toHaveCount(2);
    } finally {
      for (const device of devices) await device.close();
      await apiDelete(page.request, `/api/v1/system/users/${user.id}`);
    }
  });
});
