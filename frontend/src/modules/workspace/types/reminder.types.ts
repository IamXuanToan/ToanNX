import type { ListParams } from "@/shares/types/api.types";

import type { REMINDER_PRIORITIES, REMINDER_RECURRENCES } from "../constants/defaults";

export type ReminderPriority = (typeof REMINDER_PRIORITIES)[number];
export type ReminderRecurrence = (typeof REMINDER_RECURRENCES)[number];

/** Nhắc việc cá nhân (khớp `ReminderResponse`). */
export type Reminder = {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerUsername: string | null;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string | null;
  notifyMinutesBefore: number;
  reminderDaysBefore: number[];
  priority: ReminderPriority;
  isCompleted: boolean;
  completedAt: string | null;
  recurrence: ReminderRecurrence;
  anchorDay: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

/** Đầu vào tạo/cập nhật Nhắc việc. */
export type ReminderInput = {
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string | null;
  notifyMinutesBefore?: number;
  reminderDaysBefore?: number[];
  priority?: ReminderPriority;
  recurrence?: ReminderRecurrence;
  anchorDay?: number | null;
  tags?: string[];
};

/** Bộ lọc danh sách Nhắc việc. */
export type ReminderFilters = ListParams & {
  priority?: readonly string[];
  isCompleted?: boolean;
  recurrence?: readonly string[];
  owner?: string;
};
