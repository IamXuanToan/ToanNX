/** Hoạt động trong khoảng này thì coi là đang trực tuyến (BE ghi hoạt động tối đa mỗi phút). */
export const ONLINE_WINDOW_MS = 5 * 60_000;

/**
 * Có đang trực tuyến không: lần hoạt động gần nhất nằm trong `ONLINE_WINDOW_MS`.
 *
 * @param lastSeenAt - Thời điểm hoạt động gần nhất (ISO) hoặc null.
 * @param now - Thời điểm hiện tại.
 * @returns Đang trực tuyến hay không.
 */
export function isOnline(lastSeenAt: string | null | undefined, now: Date): boolean {
  if (!lastSeenAt) return false;
  return now.getTime() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}
