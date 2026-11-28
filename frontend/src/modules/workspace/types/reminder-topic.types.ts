/** Tóm tắt Chủ đề nhắc việc gắn trong Nhắc việc. */
export interface ReminderTopicSummary {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
}

/** Chủ đề nhắc việc (mặc định hệ thống và cá nhân). */
export interface ReminderTopic extends ReminderTopicSummary {
  ownerId: string | null;
  code: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Bộ lọc danh sách Chủ đề nhắc việc. */
export interface ReminderTopicFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

/** Payload tạo/cập nhật Chủ đề nhắc việc. */
export interface ReminderTopicInput {
  name: string;
  color?: string;
  sortOrder?: number;
}
