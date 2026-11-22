import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  NotificationPreferenceInput,
  NotificationPreferences,
} from "../types/notification.types";

/** Service tùy chọn thông báo của chính mình (BE `notification_preference_service.py`). */
export const notificationPreferenceService = {
  async get(signal?: AbortSignal): Promise<NotificationPreferences> {
    return (
      await apiClient.get<NotificationPreferences>(SYSTEM_API_ENDPOINTS.notificationPreferences, {
        signal,
      })
    ).data;
  },

  async update(items: NotificationPreferenceInput[]): Promise<NotificationPreferences> {
    return (
      await apiClient.put<NotificationPreferences>(SYSTEM_API_ENDPOINTS.notificationPreferences, {
        items,
      })
    ).data;
  },
};
