"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { workspaceSettingService } from "../services/workspace-setting.service";

/** @returns Cài đặt Digest, AI & Telegram hai chiều của người dùng (mặc định: bản thân). */
export function useWorkspaceSetting(ownerId?: string | null, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.setting(ownerId),
    queryFn: ({ signal }) => workspaceSettingService.get(ownerId, signal),
    enabled,
  });
}
