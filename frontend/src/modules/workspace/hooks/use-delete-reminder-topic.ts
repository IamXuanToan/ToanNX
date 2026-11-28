"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { reminderTopicService } from "../services/reminder-topic.service";

/** @returns Mutation xóa Chủ đề nhắc việc cá nhân. */
export function useDeleteReminderTopic() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => reminderTopicService.delete(id),
    invalidate: [workspaceKeys.reminderTopics.all, workspaceKeys.reminders.all],
    success: "deleted",
  });
}
