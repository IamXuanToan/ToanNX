"use client";

import type { ReactNode } from "react";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { LanguageProfile } from "../../components/language/language-profile";
import { usePermission } from "../../hooks/use-permission";
import { LANGUAGE_PERMISSIONS } from "../../permissions/language-permission";

/**
 * Màn hình chi tiết Ngôn ngữ (mặc định chỉ xem, bật `?mode=edit` khi có quyền sửa).
 *
 * @param props - ID bản ghi và slot lịch sử thay đổi.
 * @returns Trang chi tiết ngôn ngữ hoặc `ForbiddenView`.
 */
export function LanguageDetailView({ id, history }: { id: string; history?: ReactNode }) {
  const canRead = usePermission(LANGUAGE_PERMISSIONS.read);
  const canUpdate = usePermission(LANGUAGE_PERMISSIONS.update);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <LanguageProfile id={id} isEditing={isEditing} history={history} />
    </EditModeProvider>
  );
}
