import { apiClient } from "@/shares/lib/api/api-client";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type { SystemWebhook } from "../types/webhook.types";

/** Service danh mục webhook (BE `webhook_catalog_service.py`). */
export const webhookService = {
  /** @returns Webhook của mọi module, URL đầy đủ. */
  async list(signal?: AbortSignal): Promise<SystemWebhook[]> {
    return (await apiClient.get<SystemWebhook[]>(SYSTEM_API_ENDPOINTS.webhooks, { signal })).data;
  },
};
