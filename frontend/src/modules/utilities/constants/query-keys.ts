import { createResourceKeys } from "@/shares/lib/api/resource-keys";

/** Phạm vi chung của query key module Tiện ích (invalidate cả module bằng `["utilities"]`). */
const SCOPE = "utilities";

/** Query key của link rút gọn. */
export const shortLinkKeys = createResourceKeys(SCOPE, "short-links");

const qrCodes = createResourceKeys(SCOPE, "qr-codes");

/** Query key của mã QR (kèm danh mục ngân hàng và ảnh xem trước). */
export const qrCodeKeys = {
  ...qrCodes,
  banks: () => [SCOPE, "qr-codes", "banks"] as const,
  preview: (input: object) => [SCOPE, "qr-codes", "preview", input] as const,
};

/** Query key của đường dẫn giữa. */
export const pagePathKeys = createResourceKeys(SCOPE, "page-paths");

/** Query key của trang. */
export const pageKeys = createResourceKeys(SCOPE, "pages");
