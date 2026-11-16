import { expect, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

const LOGO_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAgUlEQVR4nNXOQREAIAzAsFJZWMC/DDwgYg+uUZB1z6ZM4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iRO4iTO34GpB/9OAfIgckhkAAAAAElFTkSuQmCC",
  "base64",
);

test("chọn logo từ Thư viện, xem trước và lưu mã QR", async ({ page }) => {
  await loginViaUi(page);
  await page.goto("/vi/quan-tri/ma-qr/tao-moi");
  await page.getByLabel("Tên", { exact: true }).fill("QR có logo");
  await page.getByRole("radio", { name: /Liên kết/ }).click();
  await page.getByLabel("Liên kết", { exact: true }).fill("https://example.com/qr-logo");

  await page.getByRole("button", { name: "Chọn ảnh từ thư viện" }).click();
  await page.getByRole("tab", { name: "Tải lên" }).click();
  await page.getByLabel("Chọn tệp").setInputFiles({
    name: "qr-logo.png",
    mimeType: "image/png",
    buffer: LOGO_PNG,
  });
  await expect(page.getByRole("button", { name: "Dùng ảnh này" })).toBeEnabled();
  await page.getByRole("button", { name: "Dùng ảnh này" }).click();

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

test("tải logo tùy chỉnh trực tiếp trên trang tạo mã QR", async ({ page }) => {
  await loginViaUi(page);
  await page.goto("/vi/quan-tri/ma-qr/tao-moi");

  await expect(page.getByRole("heading", { name: "Logo tùy chỉnh" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tải ảnh lên" })).toBeVisible();
  await page.getByLabel("Tên", { exact: true }).fill("QR logo tùy chỉnh");
  await page.getByRole("radio", { name: /Liên kết/ }).click();
  await page.getByLabel("Liên kết", { exact: true }).fill("https://example.com/qr-custom-logo");

  await page.locator('input[type="file"][aria-label="Logo ở giữa mã"]').setInputFiles({
    name: "custom-logo.png",
    mimeType: "image/png",
    buffer: LOGO_PNG,
  });
  await expect(page.getByRole("button", { name: "Gỡ ảnh" })).toBeVisible();
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
  expect((await response.json()).data.logo?.id).toBeTruthy();
});
