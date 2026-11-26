/** Chu kỳ polling công khai của module Utilities (đơn vị: ms). */
export const UTILITIES_POLLING_MS = {
  /** Lịch sử ủng hộ Donate: 60 giây khi đang mở tab Tương ứng. */
  donationFeed: 60_000,
  /** Bảng vinh danh Donate: 120 giây khi đang mở tab Bảng vinh danh. */
  donationLeaderboard: 120_000,
} as const;

/** Thời gian stale cho dữ liệu công khai quyên góp (30 giây). */
export const DONATION_PUBLIC_STALE_MS = 30_000;
