import { createResourceKeys } from "@/shares/lib/api/resource-keys";

/** Phạm vi chung của query key module Tiện ích (invalidate cả module bằng `["utilities"]`). */
const SCOPE = "utilities";

/** Query key của link rút gọn. */
const baseShortLinkKeys = createResourceKeys(SCOPE, "short-links");
export const shortLinkKeys = {
  ...baseShortLinkKeys,
  resolve: (slug: string) => [SCOPE, "short-links", "resolve", slug] as const,
};

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
const basePageKeys = createResourceKeys(SCOPE, "pages");
export const pageKeys = {
  ...basePageKeys,
  public: (segment: string, slug: string) => [SCOPE, "pages", "public", segment, slug] as const,
};

/** Query key của quyên góp và ủng hộ (Donations). */
const baseDonationKeys = createResourceKeys(SCOPE, "donations");
export const donationKeys = {
  ...baseDonationKeys,
  stats: (params?: object) => [SCOPE, "donations", "stats", params] as const,
  feed: (pageId: string) => [SCOPE, "donations", "feed", pageId] as const,
  leaderboard: (pageId: string) => [SCOPE, "donations", "leaderboard", pageId] as const,
};
