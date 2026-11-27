import { expect, type APIRequestContext, type Page, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:8002";

function apiUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

async function apiMutate<T = unknown>(
  request: APIRequestContext,
  method: "POST" | "PUT",
  path: string,
  data: Record<string, unknown>,
  origin: string,
): Promise<T> {
  const csrf = await request.get(apiUrl("/api/v1/system/auth/csrf"));
  const token = (await csrf.json()).data.csrf_token as string;
  const headers = { "X-CSRFToken": token, Origin: origin };
  const response =
    method === "PUT"
      ? await request.put(apiUrl(path), { data, headers })
      : await request.post(apiUrl(path), { data, headers });
  expect(response.ok(), await response.text()).toBe(true);
  const body: { data: T } = await response.json();
  return body.data;
}

async function apiDelete(request: APIRequestContext, path: string, origin: string) {
  const csrf = await request.get(apiUrl("/api/v1/system/auth/csrf"));
  const token = (await csrf.json()).data.csrf_token as string;
  await request.delete(apiUrl(path), { headers: { "X-CSRFToken": token, Origin: origin } });
}

async function loginPortalMember(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/vi/dang-nhap");
  await page.getByLabel("Email hoặc tên đăng nhập").fill(credentials.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/vi\/ca-nhan$/);
}

test.describe("Client Portal — Không gian cá nhân & Trợ lý AI", () => {
  test("luồng Workspace đầy đủ, lọc URL Lịch/Bảng, Gia hạn, Két sắt Reveal, AI /today và kiểm quyền 403", async ({
    page,
    browser,
  }) => {
    test.setTimeout(90_000);
    await loginViaUi(page);
    const suffix = Date.now();
    const baseURL = new URL(page.url()).origin;
    const memberPassword = "E2e-Portal-Passw0rd!";

    let memberRoleId: string | null = null;
    let memberUserId: string | null = null;
    let restrictedUserId: string | null = null;

    const memberContext = await browser.newContext({ baseURL });
    const deniedContext = await browser.newContext({ baseURL });
    try {
      // Tạo role Workspace Member (không chứa manage_all) kèm quyền xem tiền tệ VND + role không có quyền.
      const memberRole = await apiMutate<{ id: string }>(
        page.request,
        "POST",
        "/api/v1/system/roles",
        {
          code: `E2E_WORKSPACE_MEMBER_${suffix}`,
          name: "Workspace Member E2E",
        },
        baseURL,
      );
      memberRoleId = memberRole.id;

      const permsResp = await page.request.get(apiUrl("/api/v1/system/permissions"));
      expect(permsResp.ok(), await permsResp.text()).toBe(true);
      const allPerms: { data: { id: string; code: string }[] } = await permsResp.json();
      const grantedCodes = allPerms.data.filter(
        (p) =>
          (p.code.startsWith("workspace.") && !p.code.endsWith(".manage_all")) ||
          p.code === "system.currency.read",
      );
      expect(grantedCodes.length).toBeGreaterThan(20);
      await apiMutate(
        page.request,
        "PUT",
        `/api/v1/system/roles/${memberRole.id}/permissions`,
        { permission_ids: grantedCodes.map((p) => p.id) },
        baseURL,
      );

      const memberUser = await apiMutate<{ id: string; email: string }>(
        page.request,
        "POST",
        "/api/v1/system/users",
        {
          email: `e2e-ws-member-${suffix}@toannx.local`,
          username: `e2e_ws_${suffix}`,
          full_name: `Workspace Member ${suffix}`,
          password: memberPassword,
          send_invitation: false,
          is_active: true,
          is_staff: false,
        },
        baseURL,
      );
      memberUserId = memberUser.id;
      await apiMutate(
        page.request,
        "POST",
        `/api/v1/system/users/${memberUser.id}/roles`,
        { role_id: memberRole.id },
        baseURL,
      );

      const restrictedUser = await apiMutate<{ id: string; email: string }>(
        page.request,
        "POST",
        "/api/v1/system/users",
        {
          email: `e2e-ws-denied-${suffix}@toannx.local`,
          username: `e2e_ws_denied_${suffix}`,
          full_name: `Workspace Denied ${suffix}`,
          password: memberPassword,
          send_invitation: false,
          is_active: true,
          is_staff: false,
        },
        baseURL,
      );
      restrictedUserId = restrictedUser.id;
      const memberPage = await memberContext.newPage();
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      const serverErrors: string[] = [];
      memberPage.on("pageerror", (err) => pageErrors.push(err.message));
      memberPage.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      memberPage.on("response", (res) => {
        if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`);
      });

      await loginPortalMember(memberPage, {
        email: memberUser.email,
        password: memberPassword,
      });

      // 1. Dashboard Portal: 4 thẻ KPI + Lịch việc & lọc chip đồng bộ URL khi reload
      await expect(memberPage.getByText("Chi tiêu tháng này", { exact: true })).toBeVisible();
      await expect(memberPage.getByText("Lịch việc & Gia hạn", { exact: true })).toBeVisible();
      await expect(
        memberPage.locator("[data-slot=sidebar]").getByRole("link", { name: "Két sắt bí mật" }),
      ).toBeVisible();

      const reminderChip = memberPage.getByRole("button", { name: "Nhắc việc", exact: true });
      await reminderChip.click();
      await expect(memberPage).toHaveURL(/[?&]types=/);
      const filteredUrl = memberPage.url();
      await memberPage.reload();
      expect(memberPage.url()).toBe(filteredUrl);

      // 2. Thiết bị -> chi tiết -> Tab Bảo hành -> Tạo phiếu bảo hành kèm ?assetId=
      await memberPage.goto("/vi/ca-nhan/thiet-bi/tao-moi");
      await expect(
        memberPage.getByRole("combobox").filter({ hasText: /VND ·/ }).first(),
      ).toBeVisible();
      await memberPage.getByLabel("Tên thiết bị").fill(`MacBook E2E ${suffix}`);
      await memberPage.getByRole("button", { name: "Lưu", exact: true }).click();
      await expect(memberPage).toHaveURL(/\/vi\/ca-nhan\/thiet-bi\/[0-9a-f-]{36}$/);
      const assetId = memberPage.url().split("/").pop() as string;

      await memberPage.getByRole("tab", { name: /Bảo hành & Sửa chữa/ }).click();
      await memberPage.getByRole("link", { name: "Tạo phiếu bảo hành" }).click();
      await expect(memberPage).toHaveURL(
        new RegExp(`/vi/ca-nhan/bao-hanh/tao-moi\\?assetId=${assetId}$`),
      );
      await expect(
        memberPage.getByRole("combobox").filter({ hasText: /VND ·/ }).first(),
      ).toBeVisible();
      await memberPage.getByLabel("Trung tâm bảo hành").fill("Apple Care E2E");
      await memberPage.getByLabel("Mô tả lỗi / Vấn đề").fill(`Màn hình sọc ngang E2E ${suffix}`);
      await memberPage.getByRole("button", { name: "Lưu", exact: true }).click();
      await expect(memberPage).toHaveURL(/\/vi\/ca-nhan\/bao-hanh\/[0-9a-f-]{36}$/);

      // Quay về thẳng tab Bảo hành của thiết bị và xác nhận phiếu hiển thị trong bảng theo thiết bị
      await memberPage.getByRole("link", { name: "Quay lại", exact: true }).click();
      await expect(memberPage).toHaveURL(
        new RegExp(`/vi/ca-nhan/thiet-bi/${assetId}\\?tab=claims$`),
      );
      await expect(memberPage.getByRole("table")).toContainText("Apple Care E2E");

      // 3. Dịch vụ định kỳ -> Gia hạn qua dialog -> Tab Lịch sử gia hạn tăng
      await memberPage.goto("/vi/ca-nhan/dich-vu/tao-moi");
      await expect(
        memberPage.getByRole("combobox").filter({ hasText: /VND ·/ }).first(),
      ).toBeVisible();
      await memberPage.getByLabel("Tên dịch vụ").fill(`VPS E2E ${suffix}`);
      await memberPage.getByLabel("Phí định kỳ (nguyên tệ)").fill("250000");
      await memberPage.getByRole("button", { name: "Lưu", exact: true }).click();
      await expect(memberPage).toHaveURL(/\/vi\/ca-nhan\/dich-vu\/[0-9a-f-]{36}$/);

      await memberPage.getByRole("button", { name: "Gia hạn", exact: true }).click();
      const renewDialog = memberPage.getByRole("dialog");
      await renewDialog.getByRole("button", { name: "Gia hạn", exact: true }).click();
      await expect(memberPage.getByRole("tab", { name: /Lịch sử gia hạn \(1\)/ })).toBeVisible();

      // 4. Két sắt bí mật -> danh sách masked -> chi tiết -> Giải mã Reveal
      const secretPlaintext = `Secret-Token-E2E-${suffix}-9876`;
      await memberPage.goto("/vi/ca-nhan/ket-sat/tao-moi");
      await memberPage.getByLabel("Tiêu đề").fill(`Vault E2E ${suffix}`);
      await memberPage.getByLabel("Giá trị bí mật").fill(secretPlaintext);
      await memberPage.getByRole("button", { name: "Lưu", exact: true }).click();
      await expect(memberPage).toHaveURL(/\/vi\/ca-nhan\/ket-sat\/[0-9a-f-]{36}$/);

      await expect(memberPage.getByText(secretPlaintext)).toHaveCount(0);
      await memberPage.getByRole("button", { name: "Giải mã xem bí mật" }).click();
      await expect(memberPage.getByRole("dialog").getByText(secretPlaintext)).toBeVisible();
      await memberPage.getByRole("dialog").getByRole("button", { name: "Đóng" }).click();

      await memberPage.goto("/vi/ca-nhan/ket-sat");
      await expect(memberPage.getByRole("table")).toContainText("9876");

      // 5. Nhắc việc + DateTimePicker gọn 1 khung + Tooltip Nhãn + nút Quay lại thống nhất (kênh thông báo cấu hình tại Hồ sơ → Thông báo)
      await memberPage.goto("/vi/ca-nhan/nhac-viec/tao-moi");
      await expect(memberPage.getByRole("link", { name: "Quay lại" })).toBeVisible();
      await expect(memberPage.getByRole("button", { name: "Hướng dẫn nhập thẻ" })).toBeVisible();
      await memberPage.getByLabel("Tiêu đề việc").fill(`Reminder E2E ${suffix}`);
      await memberPage.getByRole("button", { name: "Lưu", exact: true }).click();
      await expect(memberPage).toHaveURL(/\/vi\/ca-nhan\/nhac-viec\/[0-9a-f-]{36}$/);
      await expect(memberPage.getByRole("link", { name: "Quay lại" })).toBeVisible();

      // 6. Nút tròn Trợ lý AI kéo-thả hít 4 cạnh & Popup 1 luồng chat (badge trường trộn + gõ / + xóa lịch sử ở header)
      const aiTrigger = memberPage.getByTestId("assistant-floating-trigger");
      await expect(aiTrigger).toBeVisible();
      await expect(aiTrigger).toHaveAttribute("data-launcher-size", /^(sm|md|lg)$/);
      await aiTrigger.click();
      const aiPopup = memberPage.getByTestId("assistant-popup-panel");
      await expect(aiPopup).toBeVisible();
      await expect(memberPage.getByTestId("assistant-popup-config")).toHaveCount(0);
      await expect(aiPopup.getByTestId("assistant-size-compact")).toHaveCount(0);
      await aiPopup.getByRole("textbox").fill("/");
      await expect(aiPopup.getByTestId("assistant-slash-suggestions")).toBeVisible();
      await expect(aiPopup.getByTestId("slash-option-clear")).toBeVisible();
      await aiPopup.getByTestId("slash-option-today").dispatchEvent("mousedown");
      await expect(aiPopup.getByText(`Reminder E2E ${suffix}`)).toBeVisible();
      await expect(aiPopup.getByTestId("assistant-clear-thread-btn")).toBeVisible();
      await memberPage.getByTestId("assistant-popup-close").click();
      await expect(aiPopup).toHaveCount(0);

      // 7. Admin cấu hình Chatbot AI theo form chuẩn (kích thước nút tròn, policy, lệnh Telegram) & có nút Quay lại
      await page.goto("/vi/quan-tri/he-thong/tro-ly-ai");
      await expect(page.getByRole("heading", { name: "Cấu hình Chatbot AI" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Quay lại" })).toBeVisible();
      await expect(page.getByTestId("admin-command-list")).toBeVisible();
      await page.getByLabel(/Lớn \(60px\)/i).click();
      await page.getByRole("button", { name: "Ngắn gọn · Tiếng Việt" }).click();
      await page.getByRole("button", { name: "Lưu", exact: true }).click();

      expect(pageErrors, `Page errors: ${pageErrors.join("; ")}`).toEqual([]);
      expect(consoleErrors, `Console errors: ${consoleErrors.join("; ")}`).toEqual([]);
      expect(serverErrors, `Server 5xx errors: ${serverErrors.join("; ")}`).toEqual([]);

      // 8. Kiểm quyền từ chối (403) với tài khoản không có quyền Workspace
      const deniedPage = await deniedContext.newPage();
      await loginPortalMember(deniedPage, {
        email: restrictedUser.email,
        password: memberPassword,
      });
      await deniedPage.goto("/vi/ca-nhan/ket-sat");
      await expect(deniedPage.getByTestId("forbidden")).toBeVisible();
      const apiRes = await deniedPage.request.get(apiUrl("/api/v1/workspace/vault-items"));
      expect(apiRes.status()).toBe(403);
    } finally {
      await memberContext.close();
      await deniedContext.close();
      if (memberUserId) {
        await apiDelete(page.request, `/api/v1/system/users/${memberUserId}`, baseURL);
      }
      if (restrictedUserId) {
        await apiDelete(page.request, `/api/v1/system/users/${restrictedUserId}`, baseURL);
      }
      if (memberRoleId) {
        await apiDelete(page.request, `/api/v1/system/roles/${memberRoleId}`, baseURL);
      }
    }
  });
});
