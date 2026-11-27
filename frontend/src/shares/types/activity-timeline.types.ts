import type { ReactNode } from "react";

/** Tông ngữ nghĩa cho từng sự kiện trên dòng thời gian lịch sử thay đổi. */
export type ActivityTone = "create" | "update" | "delete" | "restore" | "event" | "neutral";

/** Một dòng đổi field: nhãn đã dịch, giá trị cũ → mới đã định dạng và danh sách thêm/bỏ (nếu là mảng). */
export type ActivityChange = {
  field: string;
  before: ReactNode;
  after: ReactNode;
  added?: ReactNode[];
  removed?: ReactNode[];
};

/** Một sự kiện trên dòng thời gian lịch sử thay đổi dùng chung toàn hệ thống. */
export type ActivityItem = {
  id: string;
  /** Thời điểm ISO cho `<time dateTime>` và `<TimestampText />`. */
  dateTime: string;
  /** Thời điểm tùy biến thay thế cho `<TimestampText />` nếu cần. */
  time?: ReactNode;
  /** Tên người thực hiện (`fullname (username)`) hoặc `Hệ thống`. */
  actor: ReactNode;
  /** Đánh dấu thao tác tự động từ hệ thống để đổi biểu tượng sang Bot. */
  isSystem?: boolean;
  /** Động từ mô tả hành động: "đã tạo", "đã cập nhật", "đã gán vai trò"... */
  action: ReactNode;
  /** Nhãn badge ngắn phân loại hành động ("Tạo mới", "Cập nhật", "Đã xóa", "Sự kiện"). */
  actionBadge?: ReactNode;
  /** Tông hiển thị cho icon vòng tròn và badge hành động. */
  tone?: ActivityTone;
  /** Danh sách các trường đã thay đổi. */
  changes: ActivityChange[];
};

/** Mục bộ lọc hành động trong thanh công cụ dòng thời gian. */
export type ActivityTimelineFilterOption = {
  value: string;
  label: ReactNode;
  count?: number;
};
