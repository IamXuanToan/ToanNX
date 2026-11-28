"use client";

import type { ReactNode } from "react";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { EditModeProvider } from "@/shares/components/common/edit-mode-provider";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { useEditMode } from "@/shares/hooks/use-edit-mode";

import { PageFeedbackProfile } from "../../components/feedback/page-feedback-profile";
import { PAGE_FEEDBACK_PERMISSIONS } from "../../permissions/page-feedback-permission";

/**
 * Màn hình chi tiết một góp ý ẩn danh (mặc định chỉ xem, bật `?mode=edit` khi có quyền sửa).
 *
 * @param props - ID bản ghi, slot lịch sử và ngữ cảnh điều hướng (`admin` hoặc `portal`).
 * @returns Trang chi tiết hoặc `ForbiddenView`.
 */
export function PageFeedbackDetailView({
  id,
  history,
  routeContext = "admin",
}: {
  id: string;
  history?: ReactNode;
  routeContext?: "admin" | "portal";
}) {
  const canRead = usePermission(PAGE_FEEDBACK_PERMISSIONS.read);
  const canUpdate = usePermission(PAGE_FEEDBACK_PERMISSIONS.update);
  const canThank = usePermission(PAGE_FEEDBACK_PERMISSIONS.thank);
  const isEditing = useEditMode(canUpdate);

  if (!canRead) return <ForbiddenView />;

  return (
    <EditModeProvider canEdit={canUpdate}>
      <PageFeedbackProfile
        id={id}
        canUpdate={canUpdate}
        isEditing={isEditing}
        canThank={canThank}
        history={history}
        routeContext={routeContext}
      />
    </EditModeProvider>
  );
}
