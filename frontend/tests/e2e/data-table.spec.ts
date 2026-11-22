import { expect, type Page, test } from "@playwright/test";

import { E2E_ADMIN, loginViaUi } from "./helpers";

const PASSWORD = "E2e-Temp-Passw0rd!";

/**
 * Tạo người dùng qua trang "Tạo người dùng", rồi quay lại danh sách đã lọc theo email đó.
 *
 * @param page - Trang Playwright (đã đăng nhập).
 * @param email - Email người dùng mới.
 */
async function createUser(page: Page, email: string) {
  await page.goto("/vi/quan-tri/he-thong/nguoi-dung/tao-moi");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Tên người dùng").fill(email.split("@")[0]);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Tạo", exact: true }).click();
  await expect(page).toHaveURL(/\/vi\/quan-tri\/he-thong\/nguoi-dung\/[0-9a-f-]{36}$/);
}

/**
 * Tạo vai trò qua trang "Tạo vai trò".
 *
 * @param page - Trang Playwright (đã đăng nhập).
 * @param code - Mã vai trò.
 */
async function createRole(page: Page, code: string) {
  await page.goto("/vi/quan-tri/he-thong/vai-tro/tao-moi");
  await page.getByLabel("Mã vai trò").fill(code);
  await page.getByLabel("Tên vai trò").fill(`Vai trò ${code}`);
  await page.getByRole("button", { name: "Tạo", exact: true }).click();
  await expect(page).toHaveURL(/\/vi\/quan-tri\/he-thong\/vai-tro\/[0-9a-f-]{36}$/);
}

/** Bảng dữ liệu của trang. */
const table = (page: Page) => page.getByRole("table");

test.describe("Bảng dữ liệu chuẩn (DataTable)", () => {
  test("kéo đổi độ rộng cột phiên, giữ sau tải lại và tách riêng theo bảng", async ({ page }) => {
    await loginViaUi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/vi/quan-tri/he-thong/phien");
    const header = table(page).locator('thead th[data-col="user"]');
    const resize = header.getByRole("separator", {
      name: "Đổi độ rộng cột Người dùng",
      exact: true,
    });
    await expect(resize).toBeVisible();
    const original = (await header.boundingBox())!.width;
    const handle = (await resize.boundingBox())!;
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 140, handle.y + handle.height / 2, {
      steps: 10,
    });
    await page.mouse.up();
    await expect
      .poll(async () => (await header.boundingBox())!.width)
      .toBeCloseTo(original + 140, 0);
    expect(new URL(page.url()).searchParams.has("ordering")).toBe(false);
    const cellWidth = await header.evaluate((cell) => {
      const row = cell.closest("table")!.querySelector("tbody tr") as HTMLTableRowElement;
      return row.cells[(cell as HTMLTableCellElement).cellIndex].getBoundingClientRect().width;
    });
    expect(cellWidth).toBeCloseTo(original + 140, 0);
    const contentGap = await header.evaluate((cell) => {
      const row = cell.closest("table")!.querySelector("tbody tr") as HTMLTableRowElement;
      const bodyCell = row.cells[(cell as HTMLTableCellElement).cellIndex];
      const style = getComputedStyle(bodyCell);
      const available =
        bodyCell.getBoundingClientRect().width -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      return Math.abs(available - bodyCell.firstElementChild!.getBoundingClientRect().width);
    });
    expect(contentGap).toBeLessThan(1);
    await page.reload();
    await expect
      .poll(async () => (await header.boundingBox())!.width)
      .toBeCloseTo(original + 140, 0);

    await page.goto("/vi/quan-tri/he-thong/vai-tro");
    await page.getByRole("button", { name: "Cột hiển thị", exact: true }).click();
    await expect(
      page.getByRole("menuitem", { name: "Khôi phục độ rộng cột", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.goto("/vi/quan-tri/he-thong/phien");
    await expect
      .poll(async () => (await header.boundingBox())!.width)
      .toBeCloseTo(original + 140, 0);
    await page.setViewportSize({ width: 375, height: 844 });
    await expect(resize).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  });

  test("resize cột ghim cập nhật offset; bàn phím, hủy kéo và khôi phục độ rộng", async ({
    page,
  }) => {
    await loginViaUi(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/vi/quan-tri/he-thong/phien");
    for (const name of ["Người dùng", "Trạng thái"]) {
      await page.getByRole("button", { name: `Ghim cột ${name}`, exact: true }).click();
      await page.getByRole("menuitem", { name: "Ghim trái", exact: true }).click();
    }
    const header = table(page).locator('thead th[data-col="user"]');
    const next = table(page).locator('thead th[data-col="status"]');
    const resize = header.getByRole("separator");
    const original = (await header.boundingBox())!.width;
    await resize.focus();
    await resize.press("Shift+ArrowRight");
    await expect
      .poll(async () => (await header.boundingBox())!.width)
      .toBeCloseTo(original + 50, 0);
    await expect
      .poll(async () =>
        next.evaluate((cell) => {
          const table = cell.closest("table")!;
          const ids = ["__select", "__index", "user"];
          const expected = ids.reduce(
            (sum, id) =>
              sum +
              table
                .querySelector<HTMLTableCellElement>(`th[data-col="${id}"]`)!
                .getBoundingClientRect().width,
            0,
          );
          return Math.abs(parseFloat(getComputedStyle(cell).left) - expected);
        }),
      )
      .toBeLessThan(1);

    const handle = (await resize.boundingBox())!;
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 80, handle.y + handle.height / 2, {
      steps: 5,
    });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect
      .poll(async () => (await header.boundingBox())!.width)
      .toBeCloseTo(original + 50, 0);
    await resize.press("Home");
    await expect.poll(async () => (await header.boundingBox())!.width).toBe(96);
    await resize.press("End");
    await expect.poll(async () => (await header.boundingBox())!.width).toBe(1200);
    await resize.press("Home");
    await resize.dblclick();
    await expect.poll(async () => (await header.boundingBox())!.width).toBeCloseTo(original, 0);

    await resize.press("ArrowRight");
    await next.getByRole("separator").press("ArrowRight");
    await page.getByRole("button", { name: "Cột hiển thị", exact: true }).click();
    await page.getByRole("menuitem", { name: "Khôi phục độ rộng cột", exact: true }).click();
    await expect(header).toHaveCSS("position", "sticky");
    await page.getByRole("button", { name: "Cột hiển thị", exact: true }).click();
    await expect(
      page.getByRole("menuitem", { name: "Khôi phục độ rộng cột", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Ghim cột Người dùng", exact: true }).click();
    await page.getByRole("menuitem", { name: "Ghim phải", exact: true }).click();
    const rightBefore = (await header.boundingBox())!;
    const rightHandle = (await resize.boundingBox())!;
    await page.mouse.move(
      rightHandle.x + rightHandle.width / 2,
      rightHandle.y + rightHandle.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      rightHandle.x + rightHandle.width / 2 - 80,
      rightHandle.y + rightHandle.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();
    await expect
      .poll(async () => (await header.boundingBox())!.width)
      .toBeCloseTo(rightBefore.width + 80, 0);
    const rightAfter = (await header.boundingBox())!;
    expect(rightAfter.x + rightAfter.width).toBeCloseTo(rightBefore.x + rightBefore.width, 0);
  });

  test("có cột chọn, cột #, cột thao tác; dòng của chính mình không chọn/xoá được", async ({
    page,
  }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    const headers = table(page).getByRole("columnheader");
    await expect(
      headers.first().getByRole("checkbox", { name: "Chọn tất cả dòng trong trang" }),
    ).toBeVisible();
    await expect(headers.nth(1)).toHaveText("#");
    await expect(headers.last()).toHaveText("Thao tác");

    await page.getByRole("searchbox").fill(E2E_ADMIN.email);
    await page.getByRole("searchbox").press("Enter");
    const selfRow = table(page).getByRole("row").filter({ hasText: E2E_ADMIN.email });
    await expect(selfRow).toHaveCount(1);
    await expect(selfRow.getByRole("checkbox")).toBeDisabled();
    // Cột Thao tác luôn đủ Xem / Sửa / Xoá: chính mình thì Xoá hiện nhưng khoá (không ẩn).
    await expect(selfRow.getByRole("button", { name: "Xoá" })).toBeDisabled();
    await expect(selfRow.getByRole("button", { name: "Xem" })).toBeVisible();
    await expect(selfRow.getByRole("button", { name: "Sửa" })).toBeVisible();
    await expect(selfRow.getByRole("button", { name: "Sao chép" })).toBeVisible();
    // Khoá/mở là công tắc ở cột Trạng thái (không nằm trong cột Thao tác); chính mình thì bị khoá.
    await expect(selfRow.getByRole("switch")).toBeDisabled();
    const actionCell = selfRow.getByRole("cell").last();
    await expect(actionCell.getByRole("switch")).toHaveCount(0);
    await expect(actionCell.getByRole("button", { name: "Xem", exact: true })).toHaveCount(0);
  });

  test("bấm tiêu đề cột để sắp xếp: tăng → giảm → bỏ; ghi lên URL", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    const header = table(page).getByRole("columnheader", { name: /Người dùng/ });
    await header.getByRole("button", { name: /Sắp xếp/ }).click();
    await expect(page).toHaveURL(/ordering=email/);
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    await header.getByRole("button", { name: /Sắp xếp/ }).click();
    await expect(page).toHaveURL(/ordering=-email/);
    await expect(header).toHaveAttribute("aria-sort", "descending");
    await header.getByRole("button", { name: /Sắp xếp/ }).click();
    await expect(page).not.toHaveURL(/ordering=-?email/);

    // Tải lại trang vẫn giữ sắp xếp và từ khóa từ URL.
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung?ordering=email&search=e2e");
    await expect(page.getByRole("searchbox")).toHaveValue("e2e");
    await expect(header).toHaveAttribute("aria-sort", "ascending");
  });

  test("người dùng: khoá hàng loạt, mở bằng công tắc ở cột Trạng thái, xoá có xác nhận", async ({
    page,
  }) => {
    const email = `e2e-table-${Date.now()}@toannx.local`;
    await loginViaUi(page);
    await createUser(page, email);
    await page.goto(`/vi/quan-tri/he-thong/nguoi-dung?search=${encodeURIComponent(email)}`);
    const row = table(page).getByRole("row").filter({ hasText: email });
    await expect(row).toHaveCount(1);

    // Chọn dòng → thanh hàng loạt thay toolbar → Đổi trạng thái: Đã khóa.
    await row.getByRole("checkbox", { name: "Chọn dòng" }).check();
    const bulkBar = page.getByTestId("table-bulk-bar");
    await expect(bulkBar).toContainText("Đã chọn 1");
    await bulkBar.getByRole("button", { name: "Đổi trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Đã khóa" }).click();
    await expect(row.getByRole("switch")).not.toBeChecked();
    // Cột Trạng thái chỉ có công tắc, không kèm chữ.
    await expect(row).not.toContainText("Đã khóa");
    await expect(bulkBar).toHaveCount(0);

    // Mở lại bằng nút thao tác trên dòng.
    await row.getByRole("switch", { name: /Mở khoá/ }).click();
    await expect(row.getByRole("switch")).toBeChecked();

    // Xoá: hỏi xác nhận, huỷ thì không xoá; xác nhận thì dòng biến mất.
    await row.getByRole("button", { name: "Xoá" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText(email);
    await dialog.getByRole("button", { name: "Hủy" }).click();
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: "Xoá" }).click();
    await page.getByTestId("confirm-dialog-confirm").click();
    await expect(page.getByTestId("data-table-empty")).toContainText("Không có kết quả");
  });

  test("vai trò: chọn tất cả trong trang rồi xoá hàng loạt; vai trò hệ thống không chọn được", async ({
    page,
  }) => {
    const suffix = Date.now().toString().slice(-6);
    const codes = [`E2E_A_${suffix}`, `E2E_B_${suffix}`];
    await loginViaUi(page);
    for (const code of codes) await createRole(page, code);

    await page.goto("/vi/quan-tri/he-thong/vai-tro?search=ADMIN");
    const adminRow = table(page).getByRole("row").filter({ hasText: "ADMIN" }).first();
    await expect(adminRow.getByRole("checkbox")).toBeDisabled();

    await page.goto(`/vi/quan-tri/he-thong/vai-tro?search=E2E_`);
    await expect(table(page).getByRole("row").filter({ hasText: suffix })).toHaveCount(2);
    await page.getByRole("searchbox").fill(suffix);
    await page.getByRole("searchbox").press("Enter");
    await expect(table(page).getByRole("row").filter({ hasText: suffix })).toHaveCount(2);
    await table(page).getByRole("checkbox", { name: "Chọn tất cả dòng trong trang" }).check();
    const bulkBar = page.getByTestId("table-bulk-bar");
    await expect(bulkBar).toContainText("Đã chọn 2");
    await bulkBar.getByRole("button", { name: "Xoá (2)" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("Xoá 2 bản ghi?");
    await page.getByTestId("confirm-dialog-confirm").click();
    await expect(page.getByTestId("data-table-empty")).toContainText("Không có kết quả");
  });

  test("ẩn/hiện cột và đổi số dòng mỗi trang", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    await page.getByRole("button", { name: "Cột hiển thị" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Trạng thái" }).click();
    await page.keyboard.press("Escape");
    await expect(table(page).getByRole("columnheader", { name: /Trạng thái/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Cột hiển thị" }).click();
    await page.getByRole("menuitem", { name: "Hiện tất cả cột" }).click();
    await expect(table(page).getByRole("columnheader", { name: /Trạng thái/ })).toHaveCount(1);

    await page.getByRole("button", { name: "Số dòng mỗi trang" }).click();
    await page.getByRole("menuitem", { name: "50" }).click();
    await expect(page).toHaveURL(/pageSize=50/);
  });

  test("sao chép vai trò: mở trang tạo mới điền sẵn mã _COPY, tên (bản sao)", async ({ page }) => {
    const code = `E2E_C_${Date.now().toString().slice(-6)}`;
    await loginViaUi(page);
    await createRole(page, code);
    await page.goto(`/vi/quan-tri/he-thong/vai-tro?search=${code}`);
    const row = table(page).getByRole("row").filter({ hasText: code });
    await row.getByRole("button", { name: "Sao chép" }).click();
    await expect(page).toHaveURL(/\/vi\/quan-tri\/he-thong\/vai-tro\/tao-moi\?copyFrom=/);
    await expect(page.getByLabel("Mã vai trò")).toHaveValue(`${code}_COPY`);
    await expect(page.getByLabel("Tên vai trò")).toHaveValue(`Vai trò ${code} (bản sao)`);
  });

  test("ghim cột trái rồi bỏ ghim; thứ tự cột đổi theo", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    const headers = table(page).getByRole("columnheader");
    // Thứ tự mặc định: [chọn] [#] Người dùng, Quyền truy cập, Trạng thái, …
    await expect(headers.nth(2)).toContainText("Người dùng");

    await page.getByRole("button", { name: "Ghim cột Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Ghim trái" }).click();
    await expect(headers.nth(2)).toContainText("Trạng thái");
    await expect(headers.nth(2)).toHaveCSS("position", "sticky");

    await page.reload();
    await expect(headers.nth(2)).toContainText("Trạng thái"); // nhớ sau khi tải lại

    await page.getByRole("button", { name: "Ghim cột Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Bỏ ghim" }).click();
    await expect(headers.nth(2)).toContainText("Người dùng");
  });

  test("ghim phải được nhớ theo từng bảng, không truyền sang bảng vai trò", async ({ page }) => {
    await loginViaUi(page);
    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    await page.getByRole("button", { name: "Ghim cột Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Ghim phải" }).click();

    let headers = table(page).getByRole("columnheader");
    await expect(headers.nth((await headers.count()) - 2)).toContainText("Trạng thái");
    await page.goto("/vi/quan-tri/he-thong/vai-tro");
    headers = table(page).getByRole("columnheader");
    await expect(headers.nth(2)).toContainText("Vai trò");

    await page.goto("/vi/quan-tri/he-thong/nguoi-dung");
    headers = table(page).getByRole("columnheader");
    await expect(headers.nth((await headers.count()) - 2)).toContainText("Trạng thái");
    await expect(headers.nth((await headers.count()) - 2)).toHaveCSS("position", "sticky");
  });
});
