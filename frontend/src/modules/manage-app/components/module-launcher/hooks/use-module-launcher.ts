"use client";

import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";

import { useAdminGroups } from "../../admin-modules-provider/admin-modules-provider";

/**
 * Dữ liệu màn chọn module: nhóm module người dùng vào được và tên để chào.
 *
 * @returns Nhóm module và tên hiển thị.
 */
export function useModuleLauncher() {
  const groups = useAdminGroups();
  const { data } = useCurrentUser();
  return { groups, name: data?.user.firstName || data?.user.email || "" };
}
