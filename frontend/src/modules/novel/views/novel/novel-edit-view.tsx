/**
 * Trang quản trị: Chỉnh sửa tiểu thuyết (`/admin/novels/[id]`).
 */

"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { NovelProfile } from "../../components/novel/novel-profile";
import { NOVEL_PERMISSIONS } from "../../permissions/novel-permission";

/**
 * Giao diện chi tiết và cập nhật tiểu thuyết: kiểm quyền rồi ghép hồ sơ.
 *
 * @param props - ID bản ghi và slot lịch sử thay đổi.
 * @returns Hồ sơ tiểu thuyết hoặc màn không có quyền.
 */
export function NovelEditView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(NOVEL_PERMISSIONS.read);
  const canUpdate = usePermission(NOVEL_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <NovelProfile id={id} canEdit={isEditing} history={history} />
    </EditModeProvider>
  );
}
