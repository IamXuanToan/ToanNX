"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { reminderTopicService } from "../services/reminder-topic.service";
import type { ReminderTopicFilters } from "../types/reminder-topic.types";

/** @returns Danh sách Chủ đề nhắc việc (mặc định hệ thống và cá nhân). */
export function useReminderTopics(
  filters: ReminderTopicFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.reminderTopics.list(filters),
    (signal) => reminderTopicService.list(filters, signal),
    options,
  );
}
