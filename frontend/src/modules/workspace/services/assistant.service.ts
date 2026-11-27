import { apiClient } from "@/shares/lib/api/api-client";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { AssistantChatInput, AssistantChatResult } from "../types/assistant.types";

/** Service trò chuyện & slash command với Trợ lý AI (BE `assistant_service.py`). */
export const assistantService = {
  async chat(input: AssistantChatInput): Promise<AssistantChatResult> {
    return (
      await apiClient.post<AssistantChatResult>(WORKSPACE_API_ENDPOINTS.assistantChat, input, {
        opaqueKeys: ["toolCalls"],
      })
    ).data;
  },
};
