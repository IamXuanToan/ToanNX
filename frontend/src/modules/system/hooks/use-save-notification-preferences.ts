"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { notificationPreferenceService } from "../services/notification-preference.service";
import type { NotificationPreferenceInput } from "../types/notification.types";

/** @returns Mutation lưu tùy chọn thông báo. */
export function useSaveNotificationPreferences() {
  return useResourceMutation<NotificationPreferenceInput[], unknown>({
    mutationFn: (items) => notificationPreferenceService.update(items),
    invalidate: [notificationKeys.all],
    success: "saved",
  });
}
