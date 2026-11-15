"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/auth/hooks/use-permission";

import { UserProfile } from "../components/user-profile/user-profile";
import { ACCOUNT_PERMISSIONS } from "../constants/account-permissions";

/**
 * Trang chi tiết người dùng: thông tin và trạng thái tài khoản.
 *
 * Phần của module khác (vai trò từ IAM) do page truyền vào qua `extensions` (lưu cùng form),
 * để Account không phụ thuộc IAM.
 *
 * @param props - Id người dùng, slot mở rộng và slot lịch sử thay đổi.
 * @returns Giao diện chi tiết.
 */
export function UserDetailView({
  id,
  extensions,
  history,
}: {
  id: string;
  extensions?: ReactNode;
  history?: ReactNode;
}) {
  const canEdit = usePermission(ACCOUNT_PERMISSIONS.userUpdate);
  return <UserProfile id={id} canEdit={canEdit} extensions={extensions} history={history} />;
}
