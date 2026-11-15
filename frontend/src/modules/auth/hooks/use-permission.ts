"use client";

import { hasPermission } from "../services/current-user.service";
import { useCurrentUser } from "./use-current-user";

/**
 * Người dùng hiện tại có quyền hay không (chỉ để điều khiển hiển thị; backend luôn kiểm tra lại).
 *
 * @param permission - Mã quyền `module.resource.action`.
 * @returns True nếu có quyền.
 */
export function usePermission(permission: string): boolean {
  const { data } = useCurrentUser();
  return hasPermission(data, permission);
}

/**
 * Người dùng hiện tại có vai trò hay không.
 *
 * @param roleCode - Mã vai trò.
 * @returns True nếu có vai trò.
 */
export function useHasRole(roleCode: string): boolean {
  const { data } = useCurrentUser();
  return Boolean(data?.roles.some((role) => role.code === roleCode));
}
