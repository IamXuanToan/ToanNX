import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";
import { toPaginated } from "@/shares/lib/api/to-paginated";
import type { Paginated } from "@/shares/types/api.types";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  AssistantConversation,
  AssistantConversationDetail,
  AssistantConversationFilters,
  AssistantMessage,
} from "../types/assistant.types";

/** Service lịch sử hội thoại Trợ lý AI & tải thêm tin nhắn cũ (BE `assistant_conversation_service.py`). */
export const assistantConversationService = {
  ...createCrudService<
    AssistantConversation,
    AssistantConversationFilters,
    never,
    never,
    AssistantConversationDetail
  >(WORKSPACE_API_ENDPOINTS.assistantConversations, { opaqueKeys: ["toolCalls"] }),

  /** Tải thêm tin nhắn cũ của hội thoại theo phân trang chuẩn (`?page=&page_size=`). */
  async messages(
    id: string,
    params: { page?: number; pageSize?: number } = {},
    signal?: AbortSignal,
  ): Promise<Paginated<AssistantMessage>> {
    return toPaginated(
      await apiClient.get<AssistantMessage[]>(
        WORKSPACE_API_ENDPOINTS.assistantConversationMessages(id),
        { query: params, signal, opaqueKeys: ["toolCalls"] },
      ),
    );
  },
};
