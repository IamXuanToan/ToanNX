"use client";

import { use } from "react";

import type { AdminGroup } from "@/shares/types/navigation.types";

import { AdminModulesContext } from "../admin-modules-context";

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
