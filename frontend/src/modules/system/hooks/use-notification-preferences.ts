"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationKeys } from "../constants/query-keys";
import { notificationPreferenceService } from "../services/notification-preference.service";

/** @param enabled - Có quyền. @returns Kênh dùng được + ma trận sự kiện × kênh. */
export function useNotificationPreferences(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: ({ signal }) => notificationPreferenceService.get(signal),
    enabled,
  });
}
