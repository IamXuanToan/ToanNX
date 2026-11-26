"use client";

import { useQuery } from "@tanstack/react-query";

import { accountKeys } from "@/modules/system/constants/query-keys";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { USER_PERMISSIONS } from "@/modules/system/permissions/user-permission";
import { userService } from "@/modules/system/services/user.service";

/**
 * Tải danh sách người dùng để lọc/hiển thị cột Chủ sở hữu khi người dùng hiện tại có
 * đồng thời `<resource>.manage_all` và `system.user.read`.
 *
 * @param manageAllPermission - Mã quyền `manage_all` của tài nguyên Workspace.
 * @returns Cờ `canManageAll`, `canFilterOwner` và danh sách option `{ value, label }`.
 */
export function useWorkspaceOwnerOptions(manageAllPermission: string) {
  const canManageAll = usePermission(manageAllPermission);
  const canReadUsers = usePermission(USER_PERMISSIONS.userRead);
  const canFilterOwner = canManageAll && canReadUsers;

  const query = useQuery({
    queryKey: accountKeys.users({ scope: "workspace-owner-options", ordering: "email" }),
    queryFn: ({ signal }) => userService.listAll({ ordering: "email" }, signal),
    enabled: canFilterOwner,
  });

  return {
    canManageAll,
    canFilterOwner,
    ownerOptions: (query.data ?? []).map((user) => ({
      value: user.id,
      label: user.fullName ? `${user.fullName} (${user.email})` : user.email,
    })),
  };
}
