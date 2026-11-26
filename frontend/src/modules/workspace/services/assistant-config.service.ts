import { apiClient } from "@/shares/lib/api/api-client";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  AssistantBotProfile,
  AssistantConfig,
  AssistantConfigUpdateInput,
  AssistantThread,
  AssistantThreadClearResult,
} from "../types/assistant.types";

/** Service Cấu hình Chatbot AI (Admin) & Luồng chat Web 1-cửa (`assistant_config_view.py`, `assistant_thread_view.py`). */
export const assistantConfigService = {
  async get(signal?: AbortSignal): Promise<AssistantConfig> {
    return (
      await apiClient.get<AssistantConfig>(WORKSPACE_API_ENDPOINTS.assistantConfig, { signal })
    ).data;
  },

  async update(input: AssistantConfigUpdateInput): Promise<AssistantConfig> {
    return (await apiClient.patch<AssistantConfig>(WORKSPACE_API_ENDPOINTS.assistantConfig, input))
      .data;
  },

  async getBotProfile(signal?: AbortSignal): Promise<AssistantBotProfile> {
    return (
      await apiClient.get<AssistantBotProfile>(WORKSPACE_API_ENDPOINTS.assistantBotProfile, {
        signal,
      })
    ).data;
  },

  async getThread(
    params: { page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
  ): Promise<AssistantThread> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("page_size", String(params.pageSize));
    const qs = query.toString();
    const path = qs
      ? `${WORKSPACE_API_ENDPOINTS.assistantThread}?${qs}`
      : WORKSPACE_API_ENDPOINTS.assistantThread;
    return (
      await apiClient.get<AssistantThread>(path, {
        signal,
        opaqueKeys: ["toolCalls"],
      })
    ).data;
  },

  async clearThread(): Promise<AssistantThreadClearResult> {
    return (
      await apiClient.delete<AssistantThreadClearResult>(WORKSPACE_API_ENDPOINTS.assistantThread)
    ).data;
  },
};
