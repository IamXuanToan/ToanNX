"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { settingKeys } from "../constants/query-keys";
import { settingService } from "../services/setting.service";
import type { SettingUpdateInput } from "../types/setting.types";

const INVALIDATE = [settingKeys.all, settingKeys.public()];

/**
 * Mutation cập nhật cấu hình hệ thống theo ID.
 *
 * @param id - Id cấu hình cần cập nhật.
 * @returns Mutation cập nhật cấu hình.
 */
export function useUpdateSetting(id: string) {
  return useResourceMutation({
    mutationFn: (input: SettingUpdateInput) => settingService.update(id, input),
    invalidate: INVALIDATE,
  });
}
