"use client";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { RoleProfile } from "../components/role-profile/role-profile";
import { IAM_PERMISSIONS } from "../constants/iam-permissions";

/**
 * Trang chi tiết vai trò: thông tin và quyền.
 *
 * @param props - Id vai trò.
 * @returns Giao diện chi tiết vai trò.
 */
export function RoleDetailView({ id }: { id: string }) {
  const canUpdate = usePermission(IAM_PERMISSIONS.roleUpdate);
  const canReadPermissions = usePermission(IAM_PERMISSIONS.permissionRead);
  const canAssignPermissions = usePermission(IAM_PERMISSIONS.permissionAssign);
  return (
    <RoleProfile
      id={id}
      canUpdate={canUpdate}
      canReadPermissions={canReadPermissions}
      canAssignPermissions={canAssignPermissions}
    />
  );
}
