"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { notificationDeliveryService } from "../services/notification-delivery.service";

/** @returns Mutation gửi lại. */
export function useRetryNotificationDelivery() {
  return useResourceMutation<string, unknown>({
    mutationFn: (id) => notificationDeliveryService.retry(id),
    invalidate: [notificationKeys.all],
    success: "saved",
  });
}
