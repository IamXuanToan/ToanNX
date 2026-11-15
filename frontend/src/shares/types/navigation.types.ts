import type { LucideIcon } from "lucide-react";

import type { AppPathname } from "@/i18n/routing";

/**
 * Khóa dịch đầy đủ từ gốc message (`<namespace>.<key>`), ví dụ `account.nav.users`.
 * Module tự khai trong namespace của mình; `shares` không liệt kê khóa của module nào.
 */
export type MessageKey = `${string}.${string}`;

/** Đường dẫn trang quản trị (một pathname nội bộ của `routing.pathnames`). */
export type AdminHref = Exclude<Extract<AppPathname, `/admin/${string}`>, `${string}[${string}`>;

/** Mục menu trong sidebar của một module. */
export type AdminNavItem = {
  /** Khóa dịch đầy đủ của nhãn. */
  labelKey: MessageKey;
  /** Đường dẫn nội bộ (`<M>_ROUTES` của module). */
  href: AdminHref;
  icon: LucideIcon;
  /** Quyền cần có để thấy mục (bỏ trống = mọi người vào được khung quản trị). */
  permission?: string;
};

/** Mã nhóm module hiển thị ở màn chọn module. */
export type AdminGroupCode = "system" | "content";

/** Khai báo điều hướng của một module FE (mỗi module một file `navigation.ts`). */
export type AdminModuleNavigation = {
  /** Mã module, trùng mã module backend (`ModuleDescriptor.code`). */
  module: string;
  /** Khóa dịch tên và mô tả module (thẻ ở màn chọn, tiêu đề sidebar). */
  nameKey: MessageKey;
  descriptionKey: MessageKey;
  /** Nhóm hiển thị ở màn chọn module. */
  group: AdminGroupCode;
  /** Icon của module. */
  icon: LucideIcon;
  /** Menu sidebar khi đang ở trong module, theo thứ tự hiển thị. */
  items: AdminNavItem[];
};

/** Module người dùng hiện tại vào được: có ít nhất một mục được phép. */
export type AdminModule = {
  code: string;
  /** Tên đã dịch. */
  name: string;
  /** Mô tả ngắn đã dịch. */
  description: string;
  icon: LucideIcon;
  /** Mục menu đã lọc theo quyền (luôn có ít nhất một). */
  items: AdminNavItem[];
  /** Trang mở khi chọn module: mục đầu tiên được phép. */
  href: AdminHref;
};

/**
 * Nhóm module: một thẻ ở màn chọn, một sidebar khi vào trong.
 * Sidebar chia mục theo từng module của nhóm.
 */
export type AdminGroup = {
  code: AdminGroupCode;
  /** Tên nhóm đã dịch. */
  name: string;
  /** Mô tả nhóm đã dịch. */
  description: string;
  icon: LucideIcon;
  /** Module trong nhóm người dùng vào được, theo thứ tự hiển thị (luôn có ít nhất một). */
  modules: AdminModule[];
  /** Trang mở khi chọn nhóm: mục đầu tiên của module đầu tiên. */
  href: AdminHref;
};
