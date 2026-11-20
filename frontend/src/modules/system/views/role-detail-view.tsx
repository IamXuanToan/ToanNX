"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";

import { RoleProfile } from "../components/role-profile";
import { IAM_PERMISSIONS } from "../permissions/iam-permission";

/**
 * Trang chi tiết vai trò: thông tin và quyền.
 *
 * @param props - Id vai trò và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết vai trò.
 */
export function RoleDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canUpdate = usePermission(IAM_PERMISSIONS.roleUpdate);
  const canReadPermissions = usePermission(IAM_PERMISSIONS.permissionRead);
  const canAssignPermissions = usePermission(IAM_PERMISSIONS.permissionAssign);
  return (
    <RoleProfile
      id={id}
      canUpdate={canUpdate}
      canReadPermissions={canReadPermissions}
      canAssignPermissions={canAssignPermissions}
      history={history}
    />
  );
}
