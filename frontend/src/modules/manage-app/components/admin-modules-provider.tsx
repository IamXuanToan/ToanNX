"use client";

import type { ReactNode } from "react";

import type { AdminGroup } from "@/shares/types/navigation.types";

import { AdminModulesContext } from "./admin-modules-context";

/**
 * Cung cấp danh sách nhóm module người dùng vào được cho mọi trang trong khu vực quản trị.
 * `AdminShell` tính danh sách; trang và module chỉ đọc qua `useAdminGroups`, không phải import nhau.
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
