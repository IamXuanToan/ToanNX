import type { ReminderTopicSummary } from "./reminder-topic.types";

/** Mức độ ưu tiên của Nhắc việc. */
export type ReminderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

/** Chu kỳ lặp lại của Nhắc việc. */
export type ReminderRecurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/** Nhắc việc cá nhân. */
export interface Reminder {
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
  topic: ReminderTopicSummary | null;
  createdAt: string;
  updatedAt: string;
}

/** Bộ lọc danh sách Nhắc việc. */
export interface ReminderFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  priority?: ReminderPriority[];
  isCompleted?: boolean;
  recurrence?: ReminderRecurrence[];
  topic?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  owner?: string;
}

/** Payload tạo/cập nhật Nhắc việc. */
export interface ReminderInput {
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string | null;
  notifyMinutesBefore?: number;
  reminderDaysBefore?: number[];
  priority?: ReminderPriority;
  recurrence?: ReminderRecurrence;
  topicId?: string | null;
}
