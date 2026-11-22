import { apiClient } from "@/shares/lib/api/api-client";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { AppNotification, NotificationScope, UnreadCount } from "../types/notification.types";

/** Service chuông thông báo (BE `system/services/notification_service.py`). */
export const notificationService = {
  async list(
    scope: NotificationScope,
    page: number,
    signal?: AbortSignal,
  ): Promise<Paginated<AppNotification>> {
    return toPaginated(
      await apiClient.get<AppNotification[]>(SYSTEM_API_ENDPOINTS.notifications, {
        query: { scope, page, pageSize: 20 },
        signal,
      }),
    );
  },

  async unreadCount(signal?: AbortSignal): Promise<UnreadCount> {
    return (
      await apiClient.get<UnreadCount>(SYSTEM_API_ENDPOINTS.notificationUnreadCount, { signal })
    ).data;
  },

  async markRead(id: string): Promise<AppNotification> {
    return (await apiClient.post<AppNotification>(SYSTEM_API_ENDPOINTS.notificationRead(id))).data;
  },

  async markAllRead(scope?: NotificationScope): Promise<UnreadCount> {
    return (
      await apiClient.post<UnreadCount>(
        SYSTEM_API_ENDPOINTS.notificationReadAll,
        scope ? { scope } : {},
      )
    ).data;
  },

  async hide(id: string): Promise<void> {
    await apiClient.delete(SYSTEM_API_ENDPOINTS.notification(id));
  },
};
