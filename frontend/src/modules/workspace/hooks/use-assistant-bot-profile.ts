"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { assistantConfigService } from "../services/assistant-config.service";

/**
 * Lấy thông tin nhận diện Bot AI tối giản (Avatar, Tên, Model) cho nút tròn Portal.
 *
 * @param enabled - Chỉ gọi API khi user có quyền chat Trợ lý AI.
 * @returns Query `AssistantBotProfile`.
 */
export function useAssistantBotProfile(enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.assistantBotProfile(),
    queryFn: ({ signal }) => assistantConfigService.getBotProfile(signal),
    enabled,
  });
}
