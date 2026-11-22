"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { UserProfile } from "../components/user-profile";
import { USER_PERMISSIONS } from "../permissions/user-permission";

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
  const canRead = usePermission(USER_PERMISSIONS.userRead);
  const canEdit = usePermission(USER_PERMISSIONS.userUpdate);
  const isEditing = useEditMode(canEdit);
  if (!canRead) return <ForbiddenView />;
  return (
    <EditModeProvider canEdit={canEdit}>
      <UserProfile id={id} canEdit={isEditing} extensions={extensions} history={history} />
    </EditModeProvider>
  );
}
