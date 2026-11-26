"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { workspaceSettingService } from "../services/workspace-setting.service";
import type {
  WorkspaceSetting,
  WorkspaceSettingUpdateInput,
} from "../types/workspace-setting.types";

/** @returns Mutation lưu cài đặt Workspace cá nhân (múi giờ, digest, AI, Telegram). */
export function useSaveWorkspaceSetting(ownerId?: string | null) {
  return useResourceMutation<WorkspaceSettingUpdateInput, WorkspaceSetting>({
    mutationFn: (input) => workspaceSettingService.update(input, ownerId),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
