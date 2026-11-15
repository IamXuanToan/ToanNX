"use client";

import { useCurrentUser } from "@/modules/auth/hooks/use-current-user";
import { useApiErrorMessage } from "@/shares/hooks/use-api-error-message";

import { useRole } from "../../../hooks/use-iam-queries";

/**
 * Dữ liệu chi tiết vai trò: truy vấn vai trò, thông báo lỗi đã dịch và vai trò có sửa được không.
 * Vai trò hệ thống chỉ superuser được sửa (backend cũng chặn).
 *
 * @param id - Id vai trò.
 * @returns Truy vấn vai trò, hàm dịch lỗi, cờ sửa được.
 */
export function useRoleProfile(id: string) {
  const role = useRole(id);
  const errorMessage = useApiErrorMessage();
  const { data: current } = useCurrentUser();
  const editable = !role.data?.isSystem || Boolean(current?.user.isSuperuser);
  return { role, errorMessage, editable };
}
