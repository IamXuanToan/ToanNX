"use client";

import { useCurrentUser } from "@/modules/system/hooks/use-current-user";

import { useRole } from "../../hooks/use-iam-queries";

/**
 * Dữ liệu chi tiết vai trò: truy vấn vai trò và vai trò có sửa được không.
 * Vai trò hệ thống chỉ superuser được sửa (backend cũng chặn).
 *
 * @param id - Id vai trò.
 * @returns Truy vấn vai trò, cờ sửa được.
 */
export function useRoleProfile(id: string) {
  const role = useRole(id);
  const { data: current } = useCurrentUser();
  const editable = !role.data?.isSystem || Boolean(current?.user.isSuperuser);
  return { role, editable };
}
