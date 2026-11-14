import type { LucideIcon } from "lucide-react";

/** Mục điều hướng admin do từng module khai báo. */
export type AdminNavItem = {
  /** Khóa dịch trong namespace `common.nav`. */
  labelKey: "dashboard" | "users" | "roles" | "modules";
  /** Đường dẫn nội bộ (APP_ROUTES). */
  href: "/admin" | "/admin/users" | "/admin/roles" | "/admin/modules";
  icon: LucideIcon;
  /** Mã module; mục bị ẩn khi module tắt. */
  module: string;
  /** Quyền cần có để thấy mục (bỏ trống = mọi staff). */
  permission?: string;
};
