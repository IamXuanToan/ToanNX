import type { ApiModel } from "@/shares/types/api-schema";

/** Dữ liệu một cấu hình hệ thống từ backend. */
export type SystemSetting = ApiModel<"SettingResponse">;

/** Dữ liệu tạo mới cấu hình hệ thống. */
export type SettingCreateInput = ApiModel<"SettingCreateValidateRequest">;

/** Dữ liệu cập nhật cấu hình hệ thống. */
export type SettingUpdateInput = ApiModel<"PatchedSettingUpdateValidateRequest">;

/** Cấu hình công khai cho client. */
export type PublicSettings = ApiModel<"PublicSettingResponse">;

/** Bộ lọc danh sách cấu hình hệ thống. */
export interface SettingFilters {
  search?: string;
  category?: string;
  is_public?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}
