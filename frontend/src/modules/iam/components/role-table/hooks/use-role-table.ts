"use client";

import { useRoles } from "../../../hooks/use-iam-queries";

/**
 * Dữ liệu bảng vai trò.
 *
 * @returns Truy vấn vai trò.
 */
export function useRoleTable() {
  return { query: useRoles() };
}
