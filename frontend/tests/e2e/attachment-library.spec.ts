import { expect, type APIRequestContext, type Page, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

const SVG_IMAGE = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#444"/><circle cx="48" cy="36" r="18" fill="#ddd"/><path d="M12 96c0-40 72-40 72 0" fill="#ddd"/></svg>',
);
const PASSWORD = "E2e-Temp-Passw0rd!";

test("thư mục nhiều cấp trong dialog: tạo, upload, lọc và hai cách xóa nhánh", async ({ page }) => {
  test.setTimeout(90_000);
  await loginViaUi(page);
  const prefix = `e2e-folder-${Date.now()}`;
  const folderIds: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/vi/quan-tri/nguoi-dung/tao-moi");
    await page.getByRole("button", { name: "Chọn ảnh từ thư viện", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Chọn ảnh đại diện", exact: true });
    const bounds = await picker.boundingBox();
    expect(bounds?.width).toBeGreaterThan(1300);
    await picker.getByRole("button", { name: "Quản lý thư mục", exact: true }).click();
    const manager = page.getByRole("dialog", { name: "Quản lý thư mục", exact: true });
    await manager.getByLabel("Tên thư mục", { exact: true }).fill(prefix);
    await manager.getByRole("button", { name: "Tạo thư mục", exact: true }).click();
    await expect(manager.getByText(prefix, { exact: true })).toBeVisible();
    await manager.getByLabel("Tên thư mục", { exact: true }).fill(`${prefix}-child`);
    await manager.getByRole("combobox", { name: "Thư mục cha", exact: true }).click();
    await page.getByRole("option", { name: prefix, exact: true }).click();
    await manager.getByRole("button", { name: "Tạo thư mục", exact: true }).click();
    await expect(manager.getByText(`${prefix} / ${prefix}-child`, { exact: true })).toBeVisible();
    await expect
      .poll(() => manager.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
      .toBe(true);
    await page.setViewportSize({ width: 375, height: 844 });
    await expect
      .poll(() => manager.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
      .toBe(true);
    await page.screenshot({
      path: test.info().outputPath("folder-manager-mobile.png"),
      animations: "disabled",
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect
      .poll(() => manager.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
      .toBe(true);
    await page.screenshot({ path: test.info().outputPath("folder-manager.png") });
    // Submit trong dialog con không được submit form tạo người dùng phía sau.
    await expect(page).toHaveURL(/\/nguoi-dung\/tao-moi$/);
    const folders: { id: string; name: string }[] = (
      await (await page.request.get(`/api/v1/attachments/folders?search=${prefix}`)).json()
    ).data;
    folderIds.push(...folders.map((item) => item.id));
    const root = folders.find((item) => item.name === prefix)!;
    const child = folders.find((item) => item.name === `${prefix}-child`)!;
    await manager.getByRole("button", { name: "Đóng", exact: true }).click();
    await picker.getByRole("tab", { name: "Tải lên", exact: true }).click();
    await picker.getByRole("combobox", { name: "Thư mục đích", exact: true }).click();
    await page.getByRole("option", { name: `${prefix} / ${prefix}-child`, exact: true }).click();
    await picker
      .getByLabel("Chọn tệp", { exact: true })
      .setInputFiles({ name: `${prefix}.svg`, mimeType: "image/svg+xml", buffer: SVG_IMAGE });
    await expect(picker.getByRole("tab", { name: "Thư viện", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const image = (await (await page.request.get(`/api/v1/attachments?search=${prefix}`)).json())
      .data[0] as { id: string; url: string; folder_id: string };
    expect(image.folder_id).toBe(child.id);
    await picker.getByRole("button", { name: "Thư mục", exact: true }).click();
    await page
      .getByRole("option")
      .filter({ has: page.getByText(prefix, { exact: true }) })
      .getByRole("checkbox")
      .click();
    await page.keyboard.press("Escape");
    await expect(
      picker.getByRole("button", { name: `Xem ${prefix}.svg`, exact: true }),
    ).toBeVisible();
    for (const width of [375, 768, 1024, 1280, 1366, 1440, 1920]) {
      await page.setViewportSize({ width, height: width === 1366 ? 768 : 900 });
      await expect(
        picker.getByRole("button", { name: "Dùng ảnh này", exact: true }),
      ).toBeInViewport();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      await page.screenshot({
        path: test.info().outputPath(`nested-picker-${width}.png`),
      });
    }
    // Đổi loại phải thu hẹp đuôi và tự bỏ định dạng không còn tương thích.
    await picker.getByRole("button", { name: "Loại tệp", exact: true }).click();
    await page.getByRole("checkbox", { name: "Ảnh", exact: true }).click();
    await page.getByRole("checkbox", { name: "Video", exact: true }).click();
    await page.keyboard.press("Escape");
    await picker.getByRole("button", { name: "Đuôi tệp", exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "PNG (.png)", exact: true })).toHaveCount(0);
    await page.getByRole("checkbox", { name: "MP4 (.mp4)", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(picker.getByText("Không tìm thấy tệp", { exact: true })).toBeVisible();
    await picker.getByRole("button", { name: "Loại tệp", exact: true }).click();
    await page.getByRole("checkbox", { name: "Video", exact: true }).click();
    await page.getByRole("checkbox", { name: "Ảnh", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(picker.getByRole("button", { name: "Đuôi tệp", exact: true })).not.toContainText(
      "MP4",
    );
    await expect(
      picker.getByRole("button", { name: `Xem ${prefix}.svg`, exact: true }),
    ).toBeVisible();
    await picker.getByRole("button", { name: "Hủy", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/vi/quan-tri/thu-vien?search=${prefix}`);
    await page.getByRole("button", { name: "Quản lý thư mục", exact: true }).click();
    const table = manager.getByTestId("data-table-attachment-folders");
    const rootRow = table.getByRole("row").filter({ has: page.getByText(prefix, { exact: true }) });
    await rootRow.getByRole("button", { name: "Xóa thư mục", exact: true }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByRole("combobox")).toContainText("Giữ tất cả tệp");
    await page.screenshot({ path: test.info().outputPath("folder-delete-options.png") });
    await confirm.getByTestId("confirm-dialog-confirm").click();
    await expect(confirm).toHaveCount(0);
    await manager.getByRole("button", { name: "Đóng", exact: true }).click();
    const kept = (await (await page.request.get(`/api/v1/attachments/${image.id}`)).json()).data;
    expect(kept.folder_id).toBeNull();
    expect(kept.url).toBe(image.url);
    // Tạo nhánh mới để xác nhận lựa chọn xóa mềm cả file.
    const next = await post<{ id: string }>(page.request, "/api/v1/attachments/folders", {
      name: `${prefix}-delete`,
    });
    folderIds.push(next.id);
    await page.reload();
    await page.getByRole("button", { name: "Chọn tất cả", exact: true }).click();
    await page.getByRole("button", { name: "Chuyển thư mục", exact: true }).first().click();
    const move = page.getByRole("dialog", { name: "Chuyển thư mục", exact: true });
    await move.getByRole("combobox", { name: "Thư mục đích", exact: true }).click();
    await page.getByRole("option", { name: `${prefix}-delete`, exact: true }).click();
    await move.getByRole("button", { name: "Chuyển thư mục", exact: true }).click();
    await expect(move).toHaveCount(0);
    expect(
      (await (await page.request.get(`/api/v1/attachments/${image.id}`)).json()).data.folder_id,
    ).toBe(next.id);
    await page.goto("/vi/quan-tri/nguoi-dung/tao-moi");
    await page.getByRole("button", { name: "Chọn ảnh từ thư viện", exact: true }).click();
    await picker.getByRole("searchbox").fill(prefix);
    await picker.getByRole("searchbox").press("Enter");
    await picker.getByRole("button", { name: `Xem ${prefix}.svg`, exact: true }).click();
    await expect(picker.getByRole("button", { name: "Dùng ảnh này", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Quản lý thư mục", exact: true }).click();
    const nextRow = manager
      .getByRole("row")
      .filter({ has: page.getByText(`${prefix}-delete`, { exact: true }) });
    await nextRow.getByRole("button", { name: "Xóa thư mục", exact: true }).click();
    await confirm.getByRole("combobox").click();
    await page.getByRole("option", { name: "Xóa mềm cả tệp bên trong", exact: true }).click();
    await confirm.getByTestId("confirm-dialog-confirm").click();
    await expect(confirm).toHaveCount(0);
    expect((await page.request.get(`/api/v1/attachments/${image.id}`)).status()).toBe(404);
    await manager.getByRole("button", { name: "Đóng", exact: true }).click();
    await expect(picker.getByRole("button", { name: "Dùng ảnh này", exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
    expect(root.id).not.toBe(child.id);
  } finally {
    await cleanupFiles(page.request, prefix);
    for (const id of folderIds) {
      if ((await page.request.get(`/api/v1/attachments/folders/${id}`)).ok())
        await remove(page.request, `/api/v1/attachments/folders/${id}`);
    }
  }
});

/** Gọi API ghi bằng CSRF của phiên hiện tại. */
async function post<T>(
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
): Promise<T> {
  const csrf = await request.get("/api/v1/auth/csrf");
  const token = (await csrf.json()).data.csrf_token as string;
  const response = await request.post(path, { data, headers: { "X-CSRFToken": token } });
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()).data as T;
}

/** Xóa tài khoản/vai trò kiểm thử do chính ca kiểm thử tạo. */
async function remove(request: APIRequestContext, path: string) {
  const csrf = await request.get("/api/v1/auth/csrf");
  const token = (await csrf.json()).data.csrf_token as string;
  expect((await request.delete(path, { headers: { "X-CSRFToken": token } })).status()).toBe(204);
}

/** Upload ảnh mẫu qua API thật để kiểm tra cách ly quyền. */
async function upload(request: APIRequestContext, name: string): Promise<string> {
  const csrf = await request.get("/api/v1/auth/csrf");
  const token = (await csrf.json()).data.csrf_token as string;
  const response = await request.post("/api/v1/attachments", {
    headers: { "X-CSRFToken": token },
    multipart: { file: { name, mimeType: "image/svg+xml", buffer: SVG_IMAGE } },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data.id as string;
}

/** Chỉ dọn các file còn sống của ca kiểm thử; xóa mềm không xóa lịch sử DB. */
async function cleanupFiles(request: APIRequestContext, prefix: string) {
  const response = await request.get(`/api/v1/attachments?search=${prefix}&page_size=100`);
  const files: { id: string }[] = (await response.json()).data;
  if (files.length)
    await post(request, "/api/v1/attachments/bulk-delete", { ids: files.map((file) => file.id) });
}

/** Chụp và xác nhận không tràn ngang ở các bề rộng đã chốt trong rule. */
async function captureResponsive(page: Page) {
  for (const width of [375, 768, 1024, 1280, 1366, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    // Ba nút phải có ô riêng ở cả toolbar hẹp và khi sidebar/panel cùng xuất hiện.
    const actionButtons = [
      page.getByRole("button", { name: "Chọn tất cả", exact: true }),
      page.getByRole("button", { name: "Bỏ chọn tất cả", exact: true }),
      page.getByRole("button", { name: "Xóa (0)", exact: true }),
    ];
    const bounds = await Promise.all(actionButtons.map((button) => button.boundingBox()));
    for (let index = 0; index < bounds.length - 1; index += 1) {
      const current = bounds[index];
      const next = bounds[index + 1];
      expect(current).not.toBeNull();
      expect(next).not.toBeNull();
      if (current && next) expect(current.x + current.width).toBeLessThanOrEqual(next.x);
    }
    const thumbnail = await page
      .getByTestId("attachment-grid")
      .locator("img")
      .first()
      .boundingBox();
    expect(thumbnail).not.toBeNull();
    if (thumbnail) expect(thumbnail.height).toBeLessThanOrEqual(128);
    await page.screenshot({ path: test.info().outputPath(`library-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

test("thư viện B: upload, chọn hết/bỏ chọn, dùng ảnh cũ làm avatar rồi xóa mềm", async ({
  page,
}) => {
  await loginViaUi(page);
  const prefix = `e2e-media-${Date.now()}`;
  let userId: string | undefined;
  try {
    await page.goto("/vi/quan-tri/thu-vien");
    await expect(page.getByTestId("sidebar-module-attachment")).toContainText("Thư viện");
    await page.getByRole("button", { name: "Tải tệp lên", exact: true }).first().click();
    const uploadDialog = page.getByRole("dialog", { name: "Tải tệp lên", exact: true });
    await uploadDialog.getByLabel("Chọn tệp", { exact: true }).setInputFiles([
      { name: `${prefix}.svg`, mimeType: "image/svg+xml", buffer: SVG_IMAGE },
      {
        name: `${prefix}.pdf`,
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7\n%%EOF"),
      },
    ]);
    await expect(uploadDialog.getByText("Đã tải lên", { exact: true })).toHaveCount(2);
    await uploadDialog.getByRole("button", { name: "Xong", exact: true }).click();
    await page.getByRole("searchbox").fill(prefix);
    await page.getByRole("searchbox").press("Enter");
    const grid = page.getByTestId("attachment-grid");
    await expect(grid.getByRole("checkbox")).toHaveCount(2);
    await page.getByRole("button", { name: "Chọn tất cả", exact: true }).click();
    await expect(grid.getByRole("checkbox", { checked: true })).toHaveCount(2);
    await page.getByRole("button", { name: "Bỏ chọn tất cả", exact: true }).click();
    await expect(grid.getByRole("checkbox", { checked: true })).toHaveCount(0);
    await captureResponsive(page);
    await page.getByRole("button", { name: `Xem ${prefix}.svg`, exact: true }).click();
    await expect(page.getByTestId("attachment-details")).toContainText(`${prefix}.svg`);
    const response = await page.request.get(`/api/v1/attachments?search=${prefix}&kind=IMAGE`);
    const imageId: string = (await response.json()).data[0].id;

    await page.goto("/vi/quan-tri/nguoi-dung/tao-moi");
    await page.getByLabel("Email", { exact: true }).fill(`${prefix}@toannx.local`);
    await page.getByLabel("Tên người dùng", { exact: true }).fill(prefix);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Chọn ảnh từ thư viện", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Chọn ảnh đại diện", exact: true });
    await picker.getByRole("searchbox").fill(prefix);
    await picker.getByRole("searchbox").press("Enter");
    await expect(
      picker.getByRole("button", { name: `Xem ${prefix}.pdf`, exact: true }),
    ).toHaveCount(0);
    await picker.getByRole("button", { name: `Xem ${prefix}.svg`, exact: true }).click();
    await page.setViewportSize({ width: 375, height: 844 });
    await expect(
      picker.getByRole("button", { name: "Dùng ảnh này", exact: true }),
    ).toBeInViewport();
    await page.screenshot({ path: test.info().outputPath("picker-375.png"), fullPage: true });
    await picker.getByRole("button", { name: "Dùng ảnh này", exact: true }).click();
    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/nguoi-dung\/[0-9a-f-]{36}$/);
    userId = page.url().split("/").pop();
    const saved = await page.request.get(`/api/v1/account/users/${userId}`);
    expect((await saved.json()).data.avatar.id).toBe(imageId);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/vi/quan-tri/thu-vien?search=${prefix}`);
    await page.getByRole("button", { name: "Chọn tất cả", exact: true }).click();
    await page.getByRole("button", { name: "Xóa (2)", exact: true }).click();
    await expect(page.getByRole("alertdialog")).toContainText(
      "nội dung đang sử dụng tệp sẽ mất ảnh",
    );
    await page.getByTestId("confirm-dialog-confirm").click();
    await expect(page.getByText("Không tìm thấy tệp", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Không tìm thấy tệp", { exact: true })).toBeVisible();
    expect(
      (await (await page.request.get(`/api/v1/account/users/${userId}`)).json()).data.avatar,
    ).toBeNull();
  } finally {
    if (userId) await remove(page.request, `/api/v1/account/users/${userId}`);
    await cleanupFiles(page.request, prefix);
  }
});

test("upload trong bộ chọn avatar chỉ cho xác nhận ảnh, không nhận tài liệu", async ({ page }) => {
  await loginViaUi(page);
  const prefix = `e2e-picker-${Date.now()}`;
  try {
    await page.goto("/vi/quan-tri/nguoi-dung/tao-moi");
    await page.getByRole("button", { name: "Chọn ảnh từ thư viện", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Chọn ảnh đại diện", exact: true });
    await picker.getByRole("tab", { name: "Tải lên", exact: true }).click();
    await picker.getByLabel("Chọn tệp", { exact: true }).setInputFiles({
      name: `${prefix}.pdf`,
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF"),
    });
    await expect(picker.getByRole("alert")).toContainText("không phải ảnh");
    await expect(picker.getByRole("button", { name: "Dùng ảnh này", exact: true })).toBeDisabled();
    await picker
      .getByLabel("Chọn tệp", { exact: true })
      .setInputFiles({ name: `${prefix}.svg`, mimeType: "image/svg+xml", buffer: SVG_IMAGE });
    await expect(picker.getByRole("tab", { name: "Thư viện", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await picker.getByRole("button", { name: "Dùng ảnh này", exact: true }).click();
    await expect(picker).toHaveCount(0);
    await expect(page.locator("form img")).toHaveCount(1);
  } finally {
    await cleanupFiles(page.request, prefix);
  }
});

test("staff chỉ xem thư viện của mình và không thể truy cập file người khác bằng id", async ({
  page,
  browser,
}) => {
  await loginViaUi(page);
  const suffix = Date.now();
  const prefix = `e2e-private-media-${suffix}`;
  const role = await post<{ id: string }>(page.request, "/api/v1/iam/roles", {
    code: `MEDIA_${suffix}`,
    name: "Media member",
  });
  const member = await post<{ id: string; email: string }>(page.request, "/api/v1/account/users", {
    username: `media_${suffix}`,
    email: `media_${suffix}@toannx.local`,
    password: PASSWORD,
    is_staff: true,
  });
  const context = await browser.newContext({ baseURL: new URL(page.url()).origin });
  try {
    const permissions = await page.request.get(
      "/api/v1/iam/permissions?search=attachment.file.&page_size=100",
    );
    const data: { data: { id: string; code: string }[] } = await permissions.json();
    for (const permission of data.data.filter((item) =>
      ["attachment.file.read", "attachment.file.create"].includes(item.code),
    )) {
      await post(page.request, `/api/v1/iam/roles/${role.id}/permissions`, {
        permission_id: permission.id,
      });
    }
    await post(page.request, `/api/v1/iam/users/${member.id}/roles`, { role_id: role.id });
    const foreignId = await upload(page.request, `${prefix}-foreign.svg`);
    const memberPage = await context.newPage();
    await loginViaUi(memberPage, { email: member.email, password: PASSWORD });
    await upload(memberPage.request, `${prefix}-own.svg`);
    await memberPage.goto(`/vi/quan-tri/thu-vien?search=${prefix}`);
    await expect(
      memberPage.getByRole("button", { name: `Xem ${prefix}-own.svg`, exact: true }),
    ).toBeVisible();
    await expect(
      memberPage.getByRole("button", { name: `Xem ${prefix}-foreign.svg`, exact: true }),
    ).toHaveCount(0);
    await expect(memberPage.getByRole("checkbox")).toHaveCount(0);
    await expect(memberPage.getByRole("button", { name: "Xóa tệp", exact: true })).toHaveCount(0);
    expect((await memberPage.request.get(`/api/v1/attachments/${foreignId}`)).status()).toBe(404);
  } finally {
    await context.close();
    await cleanupFiles(page.request, prefix);
    await remove(page.request, `/api/v1/account/users/${member.id}`);
    await remove(page.request, `/api/v1/iam/roles/${role.id}`);
  }
});
