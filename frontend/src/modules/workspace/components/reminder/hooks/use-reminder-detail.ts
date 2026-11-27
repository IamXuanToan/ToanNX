"use client";

import { useReminder } from "../../../hooks/use-reminder";

/** @returns Query chi tiết Nhắc việc. */
export function useReminderDetail(id: string) {
  const query = useReminder(id);
  return { query };
}
