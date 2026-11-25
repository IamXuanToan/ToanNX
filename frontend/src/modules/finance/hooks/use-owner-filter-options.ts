"use client";

import { useQuery } from "@tanstack/react-query";

import { accountKeys } from "@/modules/system/constants/query-keys";
import { usePermission } from "@/modules/system/hooks/use-permission";
import { USER_PERMISSIONS } from "@/modules/system/permissions/user-permission";
import { userService } from "@/modules/system/services/user.service";

import { useFinancePersonalScope } from "./use-finance-personal-scope";

/**
 * Danh sách người dùng dùng cho bộ lọc theo người dùng của Admin khi có quyền `manage_all` và `system.user.read`.
 * Trong Client Portal (`isPortal = true`), luôn tắt lọc theo người dùng, ẩn cột chủ sở hữu và khóa phạm vi
 * về đúng `personalOwnerId` của người đang đăng nhập.
 *
 * @param manageAllPermission - Mã quyền `manage_all` của tài nguyên (thu nhập / hóa đơn).
 * @returns Cờ Portal, phạm vi cá nhân, quyền lọc theo người dùng và danh sách lựa chọn `{ value, label }`.
 */
export function useOwnerFilterOptions(manageAllPermission: string) {
  const { isPortal, personalOwnerId, scopeReady } = useFinancePersonalScope();
  const hasManageAll = usePermission(manageAllPermission);
  const canManageAll = !isPortal && hasManageAll;
  const canReadUsers = usePermission(USER_PERMISSIONS.userRead);
  const canFilterOwner = !isPortal && hasManageAll && canReadUsers;

  const query = useQuery({
    queryKey: accountKeys.users({ scope: "finance-owner-options", ordering: "email" }),
    queryFn: ({ signal }) => userService.listAll({ ordering: "email" }, signal),
    enabled: canFilterOwner,
  });

  return {
    isPortal,
    personalOwnerId,
    scopeReady,
    canManageAll,
    canFilterOwner,
    ownerOptions: (query.data ?? []).map((user) => ({
      value: user.id,
      label: user.fullName ? `${user.fullName} (${user.email})` : user.email,
    })),
  };
}
