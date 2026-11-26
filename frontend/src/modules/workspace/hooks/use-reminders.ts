"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { reminderService } from "../services/reminder.service";
import type { ReminderFilters } from "../types/reminder.types";

/** @returns Danh sách Nhắc việc cá nhân. */
export function useReminders(filters: ReminderFilters, options: { enabled?: boolean } = {}) {
  return useListQuery(
    workspaceKeys.reminders.list(filters),
    (signal) => reminderService.list(filters, signal),
    options,
  );
}
