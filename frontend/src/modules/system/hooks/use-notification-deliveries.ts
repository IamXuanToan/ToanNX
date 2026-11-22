"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { notificationKeys } from "../constants/query-keys";
import { notificationDeliveryService } from "../services/notification-delivery.service";
import type { NotificationDeliveryFilters } from "../types/notification.types";

/** @param filters - Bộ lọc. @returns Nhật ký gửi thông báo. */
export function useNotificationDeliveries(filters: NotificationDeliveryFilters) {
  return useListQuery(notificationKeys.deliveries.list(filters), (signal) =>
    notificationDeliveryService.list(filters, signal),
  );
}
