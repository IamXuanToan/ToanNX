import { apiClient } from "@/shares/lib/api/api-client";
import { createCrudService } from "@/shares/lib/api/create-crud-service";

import { SYSTEM_API_ENDPOINTS } from "../constants/api-endpoints";
import type {
  PublicSettings,
  SettingCreateInput,
  SettingFilters,
  SettingUpdateInput,
  SystemSetting,
} from "../types/setting.types";

const crud = createCrudService<
  SystemSetting,
  SettingFilters,
  SettingCreateInput,
  SettingUpdateInput
>(SYSTEM_API_ENDPOINTS.settings);

/** Service quản lý cấu hình hệ thống (Setting). */
export const settingService = {
  ...crud,

  /**
   * Lấy cấu hình công khai cho client (không cần đăng nhập).
   *
   * @returns Cấu hình công khai (auth_google_enabled, auth_github_enabled...).
   */
  async getPublicSettings(signal?: AbortSignal): Promise<PublicSettings> {
    const res = await apiClient.get<PublicSettings>(SYSTEM_API_ENDPOINTS.publicSettings, {
      signal,
    });
    return res.data;
  },
};
