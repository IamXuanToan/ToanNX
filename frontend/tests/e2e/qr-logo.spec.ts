import { expect, type Page, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

const LOGO_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAgUlEQVR4nNXOQREAIAzAsFJZWMC/DDwgYg+uUZB1z6ZM4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iTO34GpB/9OAfIgckhkAAAAAElFTkSuQmCC",
  "base64",
);

/** Tệp mới phải được tải lên tại trang Thư viện trước khi chọn làm logo QR. */
async function uploadLogoToLibrary(page: Page, name: string) {
  await page.goto("/vi/quan-tri/thu-vien");
  await page.getByRole("button", { name: "Tải tệp lên", exact: true }).click();
  const uploadDialog = page.getByRole("dialog", { name: "Tải tệp lên", exact: true });
  await uploadDialog.getByLabel("Chọn tệp", { exact: true }).setInputFiles({
    name,
    mimeType: "image/png",
    buffer: LOGO_PNG,
  });
  await expect(uploadDialog.getByText("Đã tải lên", { exact: true })).toBeVisible();
  await uploadDialog.getByRole("button", { name: "Xong", exact: true }).click();
}

test("chọn logo từ Thư viện, xem trước và lưu mã QR", async ({ page }) => {
  await loginViaUi(page);
  const logoName = `e2e-qr-logo-${Date.now()}.png`;
  await uploadLogoToLibrary(page, logoName);
  await page.goto("/vi/quan-tri/ma-qr/tao-moi");
  await page.getByLabel("Tên", { exact: true }).fill("QR có logo");
  await page.getByRole("radio", { name: /Liên kết/ }).click();
  await page.getByLabel("Liên kết", { exact: true }).fill("https://example.com/qr-logo");

  await page.getByRole("button", { name: "Chọn ảnh từ thư viện" }).click();
  const picker = page.getByRole("dialog", { name: "Chọn ảnh từ Thư viện" });
  await expect(picker.getByRole("button", { name: "Tải tệp lên" })).toBeVisible();
  await picker.getByRole("searchbox").fill(logoName);
  await picker.getByRole("searchbox").press("Enter");
  await picker.getByRole("button", { name: `Xem ${logoName}`, exact: true }).click();
  await picker.getByRole("button", { name: "Dùng ảnh này" }).click();

  await expect(page.getByText(/Có logo: tự dùng mức sửa lỗi H/)).toBeVisible();
  await expect(page.getByRole("img", { name: "Xem trước mã QR" })).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml;base64,/,
  );
  await expect
    .poll(async () => {
      const source = await page.getByRole("img", { name: "Xem trước mã QR" }).getAttribute("src");
      return source
        ? Buffer.from(source.split(",")[1], "base64").toString("utf8").includes("<image ")
        : false;
    })
    .toBe(true);
  await page.getByRole("button", { name: "Tạo", exact: true }).click();
  await expect(page).toHaveURL(/\/vi\/quan-tri\/ma-qr\/[0-9a-f-]{36}$/);

  const id = new URL(page.url()).pathname.split("/").pop();
  const response = await page.request.get(`/api/v1/qr_codes/codes/${id}`);
  expect(response.ok(), await response.text()).toBe(true);
  const code = (await response.json()).data;
  expect(code.logo?.id).toBeTruthy();
  expect(code.design.error_correction).toBe("H");
  expect(code.design.margin).toBe(4);
});

test("màn mã QR chỉ chọn logo từ Thư viện", async ({ page }) => {
  await loginViaUi(page);
  await page.goto("/vi/quan-tri/ma-qr");
  await expect(page.getByRole("button", { name: "Tải tệp lên", exact: true })).toHaveCount(0);
  await page.goto("/vi/quan-tri/ma-qr/tao-moi");

  await expect(page.getByText("Logo tùy chỉnh", { exact: true })).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toHaveCount(0);
  await page.getByRole("button", { name: "Chọn ảnh từ thư viện" }).click();
  const picker = page.getByRole("dialog", { name: "Chọn ảnh từ Thư viện" });
  await expect(picker.getByRole("button", { name: "Tải tệp lên" })).toBeVisible();
});
