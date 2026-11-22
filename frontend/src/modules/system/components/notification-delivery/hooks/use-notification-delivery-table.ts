"use client";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";

import { notificationKeys } from "../../../constants/query-keys";
import { useDeleteNotificationDelivery } from "../../../hooks/use-delete-notification-delivery";
import { useNotificationDeliveries } from "../../../hooks/use-notification-deliveries";
import { useRetryNotificationDelivery } from "../../../hooks/use-retry-notification-delivery";
import { notificationDeliveryService } from "../../../services/notification-delivery.service";
import type { NotificationDelivery } from "../../../types/notification.types";

/** @returns State bảng nhật ký gửi (lọc trạng thái, kênh) + gửi lại. */
export function useNotificationDeliveryTable() {
  const table = useTableState({ ordering: "-created_at", filterKeys: ["status", "channel"] });
  const query = useNotificationDeliveries({
    ...table.filters,
    status: table.extraFilters.status,
    channel: table.extraFilters.channel,
  });
  const retry = useRetryNotificationDelivery();
  const remove = useDeleteNotificationDelivery();
  const bulk = useBulkActions<NotificationDelivery>({
    service: notificationDeliveryService,
    invalidate: [notificationKeys.all],
  });
  return {
    table,
    query,
    retry: (row: NotificationDelivery) => retry.mutate(row.id),
    remove: (row: NotificationDelivery) => remove.mutateAsync(row.id),
    bulkDelete: bulk.bulkDelete,
  };
}
