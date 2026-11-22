"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { notificationService } from "../services/notification.service";

/**
 * Hỏi lại số chưa đọc khi tab đang hiện. Có push (service worker báo tab ngay khi có thông báo) thì chỉ hỏi
 * thưa để đồng bộ; không có push thì hỏi dày hơn nhưng vẫn quá 5 phút để Neon (gói free) được ngủ giữa hai
 * lần hỏi — xem `docs/architecture/infrastructure.md` §3.2. Quay lại tab luôn tải mới.
 */
const POLL_WITH_PUSH_MS = 15 * 60_000;
const POLL_WITHOUT_PUSH_MS = 6 * 60_000;

/**
 * @param enabled - Có quyền xem chuông.
 * @param pushActive - Trình duyệt này đã bật thông báo đẩy.
 * @returns Số chưa đọc theo tab.
 */
export function useUnreadCount(enabled: boolean, pushActive: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationService.unreadCount(signal),
    enabled,
    refetchInterval: pushActive ? POLL_WITH_PUSH_MS : POLL_WITHOUT_PUSH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
