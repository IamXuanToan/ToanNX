import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  NotificationDelivery,
  NotificationDeliveryFilters,
} from "../types/notification.types";

const crud = createCrudService<NotificationDelivery, NotificationDeliveryFilters>(
  SYSTEM_API_ENDPOINTS.notificationDeliveries,
);

/** Service nhật ký gửi thông báo (BE `notification_delivery_service.py`). */
export const notificationDeliveryService = {
  list: crud.list,
  delete: crud.delete,
  bulkDelete: crud.bulkDelete,

  async retry(id: string): Promise<NotificationDelivery> {
    return (
      await apiClient.post<NotificationDelivery>(SYSTEM_API_ENDPOINTS.notificationDeliveryRetry(id))
    ).data;
  },
};
