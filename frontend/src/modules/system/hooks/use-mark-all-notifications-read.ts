"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { notificationService } from "../services/notification.service";
import type { NotificationScope } from "../types/notification.types";

/** @returns Mutation đánh dấu đã đọc tất cả (theo tab). */
export function useMarkAllNotificationsRead() {
  return useResourceMutation<NotificationScope | undefined, unknown>({
    mutationFn: (scope) => notificationService.markAllRead(scope),
    invalidate: [notificationKeys.all],
    success: false,
  });
}
