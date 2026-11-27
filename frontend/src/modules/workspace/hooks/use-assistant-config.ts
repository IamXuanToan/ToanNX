"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConfigService } from "../services/assistant-config.service";

/**
 * Lấy trọn bộ cấu hình Chatbot AI dùng chung trên màn Admin.
 *
 * @param enabled - Bật truy vấn khi user có quyền `workspace.assistant_config.read`.
 * @returns Query `AssistantConfig`.
 */
export function useAssistantConfig(enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.assistantConfig(),
    queryFn: ({ signal }) => assistantConfigService.get(signal),
    enabled,
  });
}
