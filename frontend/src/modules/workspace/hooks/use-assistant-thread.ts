"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConfigService } from "../services/assistant-config.service";

/**
 * Lấy tin nhắn gần nhất trong 1 luồng chat Web duy nhất (`GET /workspace/assistant/thread`).
 *
 * @param enabled - Chỉ gọi khi popup hoặc sandbox chat đang mở và user có quyền chat.
 * @returns Query 1 luồng tin nhắn Web.
 */
export function useAssistantThread(enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.assistantThread(1),
    queryFn: ({ signal }) => assistantConfigService.getThread({ page: 1, pageSize: 50 }, signal),
    enabled,
  });
}
