"use client";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";

import { useFinanceRoutes } from "./use-finance-routes";

/**
 * Phạm vi sở hữu trong ngữ cảnh Portal so với Admin:
 * Trong Client Portal (`/ca-nhan/tai-chinh`), mọi truy vấn phải khóa chặt theo `currentUser.user.id`
 * kể cả khi người dùng hiện tại có quyền `manage_all`, đồng thời chờ có `user.id` trước khi gọi API.
 *
 * @returns Cờ `isPortal`, `personalOwnerId` và `scopeReady`.
 */
export function useFinancePersonalScope() {
  const { isPortal } = useFinanceRoutes();
  const { data: currentUser } = useCurrentUser();
  const personalOwnerId = isPortal ? (currentUser?.user.id ?? null) : null;

  return {
    isPortal,
    personalOwnerId,
    scopeReady: !isPortal || Boolean(personalOwnerId),
  };
}
