import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { PushDevice } from "../types/notification.types";

/** Service thiết bị nhận thông báo trình duyệt (BE `push_device_service.py`). */
export const pushDeviceService = {
  async list(signal?: AbortSignal): Promise<PushDevice[]> {
    return (await apiClient.get<PushDevice[]>(SYSTEM_API_ENDPOINTS.pushDevices, { signal })).data;
  },

  async register(fcmToken: string, deviceLabel: string): Promise<PushDevice> {
    return (
      await apiClient.post<PushDevice>(SYSTEM_API_ENDPOINTS.pushDevices, { fcmToken, deviceLabel })
    ).data;
  },

  async unregister(fcmToken: string): Promise<void> {
    await apiClient.delete(SYSTEM_API_ENDPOINTS.pushDevice(fcmToken));
  },
};
