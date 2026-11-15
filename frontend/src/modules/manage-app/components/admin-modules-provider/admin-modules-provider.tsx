"use client";

import { createContext, type ReactNode, use } from "react";

import type { AdminGroup } from "@/shares/types/navigation.types";

const AdminModulesContext = createContext<AdminGroup[] | null>(null);

/**
 * Cung cấp danh sách nhóm module người dùng vào được cho mọi trang trong khu vực quản trị.
 * `AdminShell` tính danh sách; trang và module chỉ đọc, không phải import nhau.
 *
 * @param props - Danh sách module và nội dung.
 * @returns Provider.
 */
export function AdminModulesProvider({
  groups,
  children,
}: {
  groups: AdminGroup[];
  children: ReactNode;
}) {
  return <AdminModulesContext value={groups}>{children}</AdminModulesContext>;
}

/**
 * Nhóm module người dùng hiện tại vào được (module đang bật + có quyền ít nhất một mục).
 *
 * @returns Danh sách nhóm theo thứ tự hiển thị.
 */
export function useAdminGroups(): AdminGroup[] {
  const modules = use(AdminModulesContext);
  if (modules === null) throw new Error("useAdminGroups phải dùng bên trong AdminModulesProvider.");
  return modules;
}
