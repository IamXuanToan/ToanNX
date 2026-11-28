"use client";

import type { ReactNode } from "react";

import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { EmailTemplateProfile } from "../../components/email-template/email-template-profile";
import { usePermission } from "../../hooks/use-permission";
import { EMAIL_TEMPLATE_PERMISSIONS } from "../../permissions/email-template-permission";

/**
 * Màn hình chi tiết mẫu email (mặc định chỉ xem, bật `?mode=edit` khi có quyền sửa).
 *
 * @param props - ID bản ghi, slot lịch sử và ngữ cảnh điều hướng (`admin` hoặc `portal`).
 * @returns Trang chi tiết hoặc `ForbiddenView`.
 */
export function EmailTemplateDetailView({
  id,
  history,
  routeContext = "admin",
}: {
  id: string;
  history?: ReactNode;
  routeContext?: "admin" | "portal";
}) {
  const canRead = usePermission(EMAIL_TEMPLATE_PERMISSIONS.read);
  const canUpdate = usePermission(EMAIL_TEMPLATE_PERMISSIONS.update);
  const canManageAll = usePermission(EMAIL_TEMPLATE_PERMISSIONS.manageAll);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <EmailTemplateProfile
        id={id}
        canUpdate={canUpdate}
        isEditing={isEditing}
        canManageAll={canManageAll}
        history={history}
        routeContext={routeContext}
      />
    </EditModeProvider>
  );
}
