"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { reminderTopicService } from "../services/reminder-topic.service";
import type { ReminderTopic, ReminderTopicInput } from "../types/reminder-topic.types";

/** @param id - Có ID thì sửa, không thì tạo mới. */
export function useSaveReminderTopic(id?: string) {
  return useResourceMutation<Partial<ReminderTopicInput>, ReminderTopic>({
    mutationFn: (input) =>
      id
        ? reminderTopicService.update(id, input)
        : reminderTopicService.create(input as ReminderTopicInput),
    invalidate: [workspaceKeys.reminderTopics.all, workspaceKeys.reminders.all],
    toastError: false,
  });
}
