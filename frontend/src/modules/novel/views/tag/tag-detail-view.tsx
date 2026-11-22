/**
 * Trang chi tiết/chỉnh sửa thẻ truyện (`/admin/tags/[id]`).
 */

"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { TagProfile } from "../../components/tag/tag-profile";
import { TAG_PERMISSIONS } from "../../permissions/tag-permission";

/**
 * Giao diện chi tiết và cập nhật thẻ truyện: kiểm quyền rồi ghép hồ sơ.
 *
 * @param props - ID bản ghi và slot lịch sử thay đổi.
 * @returns Hồ sơ thẻ truyện hoặc màn không có quyền.
 */
export function TagDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(TAG_PERMISSIONS.read);
  const canUpdate = usePermission(TAG_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <TagProfile id={id} canEdit={isEditing} history={history} />
    </EditModeProvider>
  );
}
