import { createResourceKeys } from "@/shares/lib/api/resource-keys";

/** Phạm vi chung của query key module Tiện ích (invalidate cả module bằng `["utilities"]`). */
export const UTILITIES_SCOPE = "utilities";

/** Query key của link rút gọn. */
const baseShortLinkKeys = createResourceKeys(UTILITIES_SCOPE, "short-links");
export const shortLinkKeys = {
  ...baseShortLinkKeys,
  resolve: (slug: string) => [UTILITIES_SCOPE, "short-links", "resolve", slug] as const,
};

const qrCodes = createResourceKeys(UTILITIES_SCOPE, "qr-codes");

/** Query key của mã QR (kèm danh mục ngân hàng và ảnh xem trước). */
export const qrCodeKeys = {
  ...qrCodes,
  banks: () => [UTILITIES_SCOPE, "qr-codes", "banks"] as const,
  preview: (input: object) => [UTILITIES_SCOPE, "qr-codes", "preview", input] as const,
};

/** Query key của đường dẫn giữa. */
export const pagePathKeys = createResourceKeys(UTILITIES_SCOPE, "page-paths");

/** Query key của trang. */
const basePageKeys = createResourceKeys(UTILITIES_SCOPE, "pages");
export const pageKeys = {
  ...basePageKeys,
  public: (segment: string, slug: string) =>
    [UTILITIES_SCOPE, "pages", "public", segment, slug] as const,
};

/** Query key của quyên góp và ủng hộ (Donations). */
const baseDonationKeys = createResourceKeys(UTILITIES_SCOPE, "donations");
export const donationKeys = {
  ...baseDonationKeys,
  stats: (params?: object) => [UTILITIES_SCOPE, "donations", "stats", params] as const,
  feed: (pageId: string) => [UTILITIES_SCOPE, "donations", "feed", pageId] as const,
  leaderboard: (pageId: string) => [UTILITIES_SCOPE, "donations", "leaderboard", pageId] as const,
};

/** Query key của góp ý / báo lỗi ẩn danh (`PageFeedback`). */
export const pageFeedbackKeys = createResourceKeys(UTILITIES_SCOPE, "page-feedbacks");
