"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { notificationDeliveryService } from "../services/notification-delivery.service";

/** @returns Mutation xóa một lần gửi thông báo (xóa mềm). */
export function useDeleteNotificationDelivery() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => notificationDeliveryService.delete(id),
    invalidate: [notificationKeys.all],
    success: "deleted",
  });
}
