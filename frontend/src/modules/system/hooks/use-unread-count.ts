"use client";

import { useQuery } from "@tanstack/react-query";

import {
  NOTIFICATION_POLL_WITHOUT_PUSH_MS,
  NOTIFICATION_POLL_WITH_PUSH_MS,
  NOTIFICATION_UNREAD_STALE_WITHOUT_PUSH_MS,
  NOTIFICATION_UNREAD_STALE_WITH_PUSH_MS,
} from "../constants/notification-polling";
import { notificationKeys } from "../constants/query-keys";
import { notificationService } from "../services/notification.service";

/**
 * Hỏi lại số chưa đọc khi tab đang hiện:
 * - Có push: polling 30 phút, staleTime 5 phút (vì Service Worker báo tab ngay khi có thông báo).
 * - Không có push: polling 15 phút, staleTime 2 phút để giảm đánh thức Neon.
 * - `refetchOnWindowFocus: true` chỉ refetch khi đã stale, không spam mỗi lần chuyển tab.
 *
 * @param enabled - Có quyền xem chuông.
 * @param pushActive - Trình duyệt này đã bật thông báo đẩy.
 * @returns Số chưa đọc theo tab.
 */
export function useUnreadCount(enabled: boolean, pushActive: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationService.unreadCount(signal),
    enabled,
    staleTime: pushActive
      ? NOTIFICATION_UNREAD_STALE_WITH_PUSH_MS
      : NOTIFICATION_UNREAD_STALE_WITHOUT_PUSH_MS,
    refetchInterval: enabled
      ? pushActive
        ? NOTIFICATION_POLL_WITH_PUSH_MS
        : NOTIFICATION_POLL_WITHOUT_PUSH_MS
      : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
