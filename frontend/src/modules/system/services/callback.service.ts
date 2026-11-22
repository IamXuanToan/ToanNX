import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { SystemCallback } from "../types/callback.types";

/** Service danh mục callback (BE `callback_catalog_service.py`). */
export const callbackService = {
  /** @returns Callback của mọi module, URL đầy đủ. */
  async list(signal?: AbortSignal): Promise<SystemCallback[]> {
    return (await apiClient.get<SystemCallback[]>(SYSTEM_API_ENDPOINTS.callbacks, { signal })).data;
  },
};
