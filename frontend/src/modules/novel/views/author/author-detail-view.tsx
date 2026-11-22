/**
 * Trang chi tiết/chỉnh sửa tác giả (`/admin/authors/[id]`).
 */

"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { AuthorProfile } from "../../components/author/author-profile";
import { AUTHOR_PERMISSIONS } from "../../permissions/author-permission";

/**
 * Giao diện chi tiết và cập nhật tác giả: kiểm quyền rồi ghép hồ sơ.
 *
 * @param props - ID bản ghi và slot lịch sử thay đổi.
 * @returns Hồ sơ tác giả hoặc màn không có quyền.
 */
export function AuthorDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(AUTHOR_PERMISSIONS.read);
  const canUpdate = usePermission(AUTHOR_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <AuthorProfile id={id} canEdit={isEditing} history={history} />
    </EditModeProvider>
  );
}
