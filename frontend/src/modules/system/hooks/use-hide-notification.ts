"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { notificationService } from "../services/notification.service";

/** @returns Mutation ẩn thông báo. */
export function useHideNotification() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => notificationService.hide(id),
    invalidate: [notificationKeys.all],
    success: false,
  });
}
