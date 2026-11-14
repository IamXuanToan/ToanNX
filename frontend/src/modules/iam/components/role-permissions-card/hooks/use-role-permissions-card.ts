"use client";

import { useMemo } from "react";

import { useRolePermissionMutation } from "../../../hooks/use-iam-mutations";
import { usePermissions } from "../../../hooks/use-iam-queries";
import { groupPermissionsByModule } from "../../../services/iam.service";
import type { RoleDetail } from "../../../types/iam.types";

/**
 * Danh sách quyền theo module và trạng thái đã gán cho vai trò.
 *
 * @param role - Vai trò.
 * @param canRead - Có quyền xem danh sách quyền.
 * @returns Nhóm quyền, trạng thái và hàm bật/tắt.
 */
export function useRolePermissionsCard(role: RoleDetail, canRead: boolean) {
  const permissions = usePermissions({ enabled: canRead });
  const mutation = useRolePermissionMutation(role.id);
  const assigned = useMemo(
    () => new Set(role.permissions.map((item) => item.id)),
    [role.permissions],
  );
  const groups = useMemo(
    () => groupPermissionsByModule(canRead ? (permissions.data ?? []) : role.permissions),
    [canRead, permissions.data, role.permissions],
  );
  return {
    isLoading: canRead && permissions.isPending,
    groups,
    isAssigned: (id: string) => assigned.has(id),
    toggle: (permissionId: string, assign: boolean) => mutation.mutate({ permissionId, assign }),
    pendingId: mutation.isPending ? mutation.variables?.permissionId : undefined,
  };
}
