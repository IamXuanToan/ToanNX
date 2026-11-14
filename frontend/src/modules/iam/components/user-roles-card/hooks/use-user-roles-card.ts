"use client";

import { useUser } from "@/modules/account/hooks/use-account-queries";
import { usePermission } from "@/modules/auth/hooks/use-permission";

import { IAM_PERMISSIONS } from "../../../constants/iam-permissions";
import { useUserRoleMutation } from "../../../hooks/use-iam-mutations";
import { useRoles, useUserRoles } from "../../../hooks/use-iam-queries";

/**
 * Vai trò đã gán + danh sách vai trò để bật/tắt cho một người dùng.
 *
 * @param userId - Id người dùng.
 * @returns Dữ liệu, quyền và hàm bật/tắt vai trò.
 */
export function useUserRolesCard(userId: string) {
  const canReadRoles = usePermission(IAM_PERMISSIONS.roleRead);
  const canAssign = usePermission(IAM_PERMISSIONS.roleAssign);
  const user = useUser(userId);
  const assignedRoles = useUserRoles(userId, { enabled: canReadRoles || canAssign });
  const roles = useRoles({ enabled: canReadRoles });
  const mutation = useUserRoleMutation(userId);
  const assigned = new Set((assignedRoles.data ?? []).map((role) => role.id));

  return {
    isSuperuser: Boolean(user.data?.isSuperuser),
    canReadRoles,
    canAssign,
    assignedRoles,
    roles,
    isAssigned: (roleId: string) => assigned.has(roleId),
    toggle: (roleId: string, assign: boolean) => mutation.mutate({ roleId, assign }),
    pendingRoleId: mutation.isPending ? mutation.variables?.roleId : undefined,
  };
}
