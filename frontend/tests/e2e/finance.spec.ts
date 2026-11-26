import { createHmac } from "node:crypto";

import { type APIRequestContext, expect, test } from "@playwright/test";

import { loginViaUi } from "./helpers";

/** Backend E2E (cổng riêng): API và webhook gọi trực tiếp Django `localhost:8002`. */
const BACKEND = process.env.E2E_API_URL ?? "http://localhost:8002";

type SepayStatus = { webhook_url: string; webhook_secret: string };
type Income = {
  id: string;
  platform_name: string | null;
  amount: string;
  tax_rate: string | null;
  tax_amount: string;
  gross_amount: string;
  tax_status: string;
};

/** Lấy CSRF của phiên hiện tại (body snake_case: gọi trực tiếp backend E2E). */
async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${BACKEND}/api/v1/system/auth/csrf`);
  return (await response.json()).data.csrf_token as string;
}

/** Gọi API ghi bằng CSRF của phiên hiện tại; trả `data` của envelope. */
async function send<T>(
  request: APIRequestContext,
  method: "post" | "put",
  path: string,
  data: Record<string, unknown>,
  origin: string,
): Promise<T> {
  const response = await request[method](`${BACKEND}${path}`, {
    data,
    headers: { "X-CSRFToken": await csrf(request), Origin: origin },
  });
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()).data as T;
}

/** Gửi webhook giống SePay tới URL riêng: HMAC-SHA256 trên `{timestamp}.{raw body}` bằng secret riêng. */
async function sendWebhook(
  request: APIRequestContext,
  status: SepayStatus,
  body: Record<string, unknown>,
) {
  const raw = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", status.webhook_secret)
    .update(`${timestamp}.${raw}`)
    .digest("hex");
  return request.post(`${BACKEND}${new URL(status.webhook_url).pathname}`, {
    data: raw,
    headers: {
      "Content-Type": "application/json",
      "X-SePay-Signature": `sha256=${signature}`,
      "X-SePay-Timestamp": String(timestamp),
    },
  });
}

/** Giờ VN dạng SePay gửi (`YYYY-MM-DD HH:mm:ss`). */
function vnNow() {
  const now = new Date(Date.now() + 7 * 3_600_000);
  return now.toISOString().slice(0, 19).replace("T", " ");
}

test.describe("Tài chính", () => {
  test("webhook SePay riêng → nhận diện nền tảng (kèm màu) → khấu trừ 10%; chuông dẫn về Client", async ({
    page,
    baseURL,
  }) => {
    const run = Date.now();
    const keyword = `E2EPAY${run}`;
    const platformName = `Nền tảng E2E ${run}`;
    const origin = baseURL ?? "http://localhost:3002";
    await loginViaUi(page);

    // Nền tảng tạo qua form Client Portal kèm quy tắc phân loại qua phím tắt `+` (dialog), cấu hình màu #2563EB.
    await page.goto("/vi/ca-nhan/tai-chinh/nen-tang/tao-moi");
    await page.getByLabel("Tên", { exact: true }).fill(platformName);
    await page.getByLabel("Mã", { exact: true }).fill(`e2e-${run}`);
    await page.getByRole("button", { name: "Chọn màu gợi ý #2563EB" }).click();

    await page.getByTestId("platform-rules-shortcut-btn").click();
    const rulesDialog = page.getByTestId("platform-rules-dialog");
    await expect(rulesDialog).toBeVisible();
    await rulesDialog.getByTestId("add-rule-btn").click();
    await rulesDialog.getByLabel("Tên", { exact: false }).fill(`Quy tắc ${run}`);
    await rulesDialog.getByLabel("Regex", { exact: false }).fill(keyword);
    await rulesDialog.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(rulesDialog.getByText(`Quy tắc ${run}`)).toBeVisible();
    await rulesDialog.getByRole("button", { name: "Đóng" }).click();
    await expect(rulesDialog).toHaveCount(0);

    await page.getByRole("button", { name: "Tạo", exact: true }).click();
    await expect(page).toHaveURL(/\/vi\/ca-nhan\/tai-chinh\/nen-tang\/[0-9a-f-]{36}$/);
    const platformId = page.url().split("/").pop() as string;

    await send(
      page.request,
      "post",
      `/api/v1/finance/platforms/${platformId}/tax-rates`,
      {
        effective_from: "2000-01-01",
        tax_withheld: true,
        rate: "10",
      },
      origin,
    );

    // Kết nối SePay của chính mình (chưa cần token) → URL và secret webhook riêng.
    const status = await send<SepayStatus>(
      page.request,
      "put",
      "/api/v1/finance/sepay/connection",
      {
        is_active: true,
      },
      origin,
    );
    expect(status.webhook_url).toMatch(/\/api\/v1\/finance\/sepay\/webhook\/[^/]+$/);

    const payload = {
      id: run % 2_000_000_000,
      gateway: "MBBank",
      transactionDate: vnNow(),
      accountNumber: "0000E2E",
      subAccount: null,
      code: null,
      content: `${keyword} PAYMENT`,
      transferType: "in",
      description: "",
      transferAmount: 900000,
      accumulated: 0,
      referenceCode: `FTE2E${run}`,
    };
    const first = await sendWebhook(page.request, status, payload);
    expect(first.status()).toBe(200);
    expect(await first.json()).toEqual({ success: true });
    // SePay gửi lại cùng id → vẫn thành công, không thêm dòng.
    expect((await sendWebhook(page.request, status, payload)).status()).toBe(200);
    // Sai secret → bị từ chối.
    const forged = await sendWebhook(page.request, { ...status, webhook_secret: "sai" }, payload);
    expect(forged.ok()).toBe(false);

    // N = 900.000, r = 10% → T = 100.000, G = 1.000.000.
    const list = await page.request.get(`${BACKEND}/api/v1/finance/incomes?search=${keyword}`);
    const incomes = (await list.json()).data as Income[];
    expect(incomes).toHaveLength(1);
    expect(incomes[0]).toMatchObject({ platform_name: platformName, tax_status: "WITHHELD" });
    expect(Number(incomes[0].amount)).toBe(900000);
    expect(Number(incomes[0].tax_amount)).toBe(100000);
    expect(Number(incomes[0].gross_amount)).toBe(1000000);

    await page.goto("/vi/ca-nhan/tai-chinh/thu-nhap");
    await expect(page.locator("[data-slot=sidebar] [data-active=true]")).toHaveCount(1);
    await page.getByPlaceholder("Tìm theo nội dung, mã giao dịch...").fill(keyword);
    const rows = page.getByRole("row").filter({ hasText: platformName });
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Đã khấu trừ");

    // Bấm vào thông báo tiền vào trên chuông phải điều hướng sang Client Portal (/vi/ca-nhan/tai-chinh/thu-nhap/{id})
    await page.getByRole("button", { name: "Thông báo", exact: true }).click();
    const incomeNotif = page
      .getByRole("button")
      .filter({ hasText: `Tiền vào` })
      .filter({ hasText: platformName })
      .first();
    await expect(incomeNotif).toBeVisible();
    await incomeNotif.click();
    await expect(page).toHaveURL(new RegExp(`/vi/ca-nhan/tai-chinh/thu-nhap/${incomes[0].id}$`));
  });

  test("dashboard hợp nhất có biểu đồ, Kết nối SePay, Webhook và Nhật ký thông báo", async ({
    page,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://localhost:3002";
    await loginViaUi(page);
    await expect(page.getByTestId("portal-dashboard")).toBeVisible();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();

    await send(
      page.request,
      "put",
      "/api/v1/finance/sepay/connection",
      { is_active: true },
      origin,
    );

    await page.goto("/vi/ca-nhan/tai-chinh/bao-cao");
    await expect(page.getByRole("table").first()).toBeVisible();

    await page.goto("/vi/ca-nhan/tai-chinh/ket-noi-sepay");
    await expect(page.getByText("Webhook riêng của bạn")).toBeVisible();
    await expect(page.getByText(/\/api\/v1\/finance\/sepay\/webhook\/[^/\s]+/)).toBeVisible();

    await page.goto("/vi/quan-tri/he-thong/webhook");
    await expect(page.getByText(/\/finance\/sepay\/webhook\/\{public_id\}/)).toBeVisible();

    await page.goto("/vi/quan-tri/he-thong/nhat-ky-thong-bao");
    await expect(page.getByRole("heading", { name: "Nhật ký thông báo" })).toBeVisible();

    // Chuông có 2 tab Cá nhân / Hệ thống (đóng toast góc phải nếu vừa hiện khi chuyển sang Admin).
    await expect(async () => {
      const closeBtn = page.locator("[data-sonner-toast] button").first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true }).catch(() => undefined);
      }
      await page.getByRole("button", { name: "Thông báo", exact: true }).click({ timeout: 2000 });
    }).toPass({ timeout: 10_000 });
    await expect(page.getByRole("tab", { name: "Cá nhân" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Hệ thống" })).toBeVisible();
  });
});
