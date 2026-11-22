"use client";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { UserRolePicker } from "../../components/user-role/user-role-picker";
import { IAM_PERMISSIONS } from "../../permissions/iam-permission";

/**
 * Slot vai trò cho form người dùng (tạo và sửa): hiện khi được xem hoặc gán vai trò; chỉ gán được khi
 * có `system.role.assign`. Tạo mới thì cần cả quyền đọc danh mục vai trò mới chọn được.
 *
 * @param props - Id người dùng đang sửa hoặc id nguồn khi sao chép.
 * @returns Card vai trò hoặc không gì.
 */
export function UserRolePickerView({ userId, copyFrom }: { userId?: string; copyFrom?: string }) {
  const canRead = usePermission(IAM_PERMISSIONS.roleRead);
  const canAssign = usePermission(IAM_PERMISSIONS.roleAssign);
  if (!canRead && !canAssign) return null;
  if (!userId && !canRead) return null;
  return (
    <UserRolePicker userId={userId} copyFrom={copyFrom} canRead={canRead} canAssign={canAssign} />
  );
}
