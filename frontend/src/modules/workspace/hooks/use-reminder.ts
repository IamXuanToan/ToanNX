"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { reminderService } from "../services/reminder.service";

/** @returns Chi tiết một Nhắc việc cá nhân. */
export function useReminder(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.reminders.detail(id ?? ""),
    queryFn: ({ signal }) => reminderService.get(id ?? "", signal),
    enabled: Boolean(id) && enabled,
  });
}
