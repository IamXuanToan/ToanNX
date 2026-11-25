"use client";

import { useQuery } from "@tanstack/react-query";

import { settingKeys } from "../constants/query-keys";
import { settingService } from "../services/setting.service";
import type { PublicSettings } from "../types/setting.types";

/**
 * Hook lấy cấu hình công khai của hệ thống (bật/tắt Google/GitHub login...).
 *
 * @returns Query kết quả cấu hình công khai.
 */
export function usePublicSettings() {
  return useQuery<PublicSettings>({
    queryKey: settingKeys.public(),
    queryFn: ({ signal }) => settingService.getPublicSettings(signal),
    staleTime: 5 * 60 * 1000,
  });
}
