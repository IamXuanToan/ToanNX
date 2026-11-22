/**
 * Trang chi tiết/chỉnh sửa thể loại (`/admin/genres/[id]`).
 */

"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { GenreProfile } from "../../components/genre/genre-profile";
import { GENRE_PERMISSIONS } from "../../permissions/genre-permission";

/**
 * Giao diện chi tiết và cập nhật thể loại: kiểm quyền rồi ghép hồ sơ.
 *
 * @param props - ID bản ghi và slot lịch sử thay đổi.
 * @returns Hồ sơ thể loại hoặc màn không có quyền.
 */
export function GenreDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(GENRE_PERMISSIONS.read);
  const canUpdate = usePermission(GENRE_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <GenreProfile id={id} canEdit={isEditing} history={history} />
    </EditModeProvider>
  );
}
