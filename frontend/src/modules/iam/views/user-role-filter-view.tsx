"use client";

import { PermissionGate } from "@/modules/auth/components/permission-gate";

import { UserRoleFilter } from "../components/user-role-filter/user-role-filter";
import { IAM_PERMISSIONS } from "../constants/iam-permissions";

/** @returns Slot lọc vai trò, chỉ tải danh sách khi có quyền đọc vai trò. */
export function UserRoleFilterView() {
  return (
    <PermissionGate permission={IAM_PERMISSIONS.roleRead}>
      <UserRoleFilter />
    </PermissionGate>
  );
}
