import { apiClient } from "@/shares/lib/api/api-client";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  WorkspaceSetting,
  WorkspaceSettingUpdateInput,
} from "../types/workspace-setting.types";

/** Service Cài đặt Workspace, Digest, AI & Telegram (BE `workspace_setting_service.py`). */
export const workspaceSettingService = {
  async get(ownerId?: string | null, signal?: AbortSignal): Promise<WorkspaceSetting> {
    const path = ownerId
      ? WORKSPACE_API_ENDPOINTS.settingsByOwner(ownerId)
      : WORKSPACE_API_ENDPOINTS.settings;
    return (await apiClient.get<WorkspaceSetting>(path, { signal })).data;
  },

  async update(
    input: WorkspaceSettingUpdateInput,
    ownerId?: string | null,
  ): Promise<WorkspaceSetting> {
    const path = ownerId
      ? WORKSPACE_API_ENDPOINTS.settingsByOwner(ownerId)
      : WORKSPACE_API_ENDPOINTS.settings;
    return (await apiClient.patch<WorkspaceSetting>(path, input)).data;
  },
};
