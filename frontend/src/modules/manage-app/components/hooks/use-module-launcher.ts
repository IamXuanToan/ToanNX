"use client";

import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { getUserDisplayName } from "@/shares/components/common/user-avatar";

import { useAdminGroups } from "../admin-modules-provider";

/**
 * Dữ liệu màn chọn module: nhóm module người dùng vào được, thông tin tài khoản và định danh hiển thị.
 *
 * @returns Danh sách nhóm module cùng dữ liệu tài khoản quản trị viên.
 */
export function useModuleLauncher() {
  const groups = useAdminGroups();
  const { data } = useCurrentUser();
  const user = data?.user;
  const displayName = getUserDisplayName(user);

  return {
    groups,
    user,
    displayName,
    name: displayName,
  };
}
