"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { notificationService } from "../services/notification.service";

/** Polling 60 giây khi tab đang hiện (dự phòng khi không có push). */
const POLL_MS = 60_000;

/** @param enabled - Có quyền xem chuông. @returns Số chưa đọc theo tab. */
export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationService.unreadCount(signal),
    enabled,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
