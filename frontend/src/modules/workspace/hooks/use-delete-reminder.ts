"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { reminderService } from "../services/reminder.service";

/** @returns Mutation xóa mềm một Nhắc việc. */
export function useDeleteReminder() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => reminderService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
