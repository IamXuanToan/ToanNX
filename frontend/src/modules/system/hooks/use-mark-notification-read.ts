"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { notificationService } from "../services/notification.service";

/** @returns Mutation đánh dấu đã đọc. */
export function useMarkNotificationRead() {
  return useResourceMutation<string, unknown>({
    mutationFn: (id) => notificationService.markRead(id),
    invalidate: [notificationKeys.all],
    success: false,
  });
}
