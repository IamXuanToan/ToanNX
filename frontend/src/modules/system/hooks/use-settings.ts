"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { settingKeys } from "../constants/query-keys";
import { settingService } from "../services/setting.service";
import type { SettingFilters } from "../types/setting.types";

/**
 * Danh sách cấu hình hệ thống (giữ dữ liệu trang trước khi chuyển trang).
 *
 * @param filters - Bộ lọc và phân trang.
 * @returns Truy vấn React Query danh sách cấu hình.
 */
export function useSettings(filters: SettingFilters) {
  return useListQuery(settingKeys.settings(filters), (signal) =>
    settingService.list(filters, signal),
  );
}
