/**
 * Trang chi tiết/chỉnh sửa chương truyện (`/admin/chapters/[id]`).
 */

"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { ChapterProfile } from "../../components/chapter/chapter-profile";
import { CHAPTER_PERMISSIONS } from "../../permissions/chapter-permission";

/**
 * Giao diện chi tiết và cập nhật chương truyện: kiểm quyền rồi ghép hồ sơ.
 *
 * @param props - ID bản ghi và slot lịch sử thay đổi.
 * @returns Hồ sơ chương truyện hoặc màn không có quyền.
 */
export function ChapterDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(CHAPTER_PERMISSIONS.read);
  const canUpdate = usePermission(CHAPTER_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <ChapterProfile id={id} canEdit={isEditing} history={history} />
    </EditModeProvider>
  );
}
