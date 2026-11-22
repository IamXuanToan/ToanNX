"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { settingKeys } from "../constants/query-keys";
import { settingService } from "../services/setting.service";

/** @returns Mutation xóa một cài đặt (hệ thống quay về giá trị mặc định trong code). */
export function useDeleteSetting() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => settingService.delete(id),
    invalidate: [settingKeys.all, settingKeys.public()],
    success: "deleted",
  });
}
