/** Chu kỳ polling số thông báo chưa đọc & đồng bộ đăng ký thiết bị Push (đơn vị: ms). */
export const NOTIFICATION_POLL_WITH_PUSH_MS = 30 * 60_000;
export const NOTIFICATION_POLL_WITHOUT_PUSH_MS = 15 * 60_000;

/** Ngưỡng stale thông minh khi người dùng quay lại focus cửa sổ trình duyệt. */
export const NOTIFICATION_UNREAD_STALE_WITH_PUSH_MS = 5 * 60_000;
export const NOTIFICATION_UNREAD_STALE_WITHOUT_PUSH_MS = 2 * 60_000;

/** Khóa và thời hạn chống gọi POST /push-devices lặp lại khi F5 nếu token & thiết bị không đổi. */
export const PUSH_DEVICE_SYNC_STORAGE_KEY = "system_push_device_sync";
export const PUSH_DEVICE_SYNC_TTL_MS = 24 * 60 * 60_000;
