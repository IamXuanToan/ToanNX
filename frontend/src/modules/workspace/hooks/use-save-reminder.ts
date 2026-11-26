"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { reminderService } from "../services/reminder.service";
import type { Reminder, ReminderInput } from "../types/reminder.types";

/** @param id - Có ID thì sửa (hoặc đổi trạng thái hoàn thành), không thì tạo mới. */
export function useSaveReminder(id?: string) {
  return useResourceMutation<Partial<ReminderInput> & { isCompleted?: boolean }, Reminder>({
    mutationFn: (input) =>
      id ? reminderService.update(id, input) : reminderService.create(input as ReminderInput),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
