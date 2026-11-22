"use client";

import { PermissionGate } from "@/modules/system/components/permission/permission-gate";

import { UserRoleFilter } from "../../components/user-role/user-role-filter";
import { IAM_PERMISSIONS } from "../../permissions/iam-permission";

/** @returns Slot lọc vai trò, chỉ tải danh sách khi có quyền đọc vai trò. */
export function UserRoleFilterView() {
  return (
    <PermissionGate permission={IAM_PERMISSIONS.roleRead}>
      <UserRoleFilter />
    </PermissionGate>
  );
}
