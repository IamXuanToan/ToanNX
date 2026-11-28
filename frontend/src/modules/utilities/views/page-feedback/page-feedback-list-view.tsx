"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PageFeedbackTable } from "../../components/feedback/page-feedback-table";
import { PAGE_FEEDBACK_PERMISSIONS } from "../../permissions/page-feedback-permission";

/**
 * Màn hình danh sách góp ý / báo lỗi ẩn danh (dùng chung cho Admin và Client Portal).
 *
 * @param props - Ngữ cảnh điều hướng (`admin` hoặc `portal`).
 * @returns Danh sách góp ý hoặc `ForbiddenView`.
 */
export function PageFeedbackListView({
  routeContext = "admin",
}: {
  routeContext?: "admin" | "portal";
}) {
  const t = useTranslations("utilities.feedbacks");
  const canRead = usePermission(PAGE_FEEDBACK_PERMISSIONS.read);
  const canUpdate = usePermission(PAGE_FEEDBACK_PERMISSIONS.update);
  const canDelete = usePermission(PAGE_FEEDBACK_PERMISSIONS.delete);
  const canThank = usePermission(PAGE_FEEDBACK_PERMISSIONS.thank);
  const canManageAll = usePermission(PAGE_FEEDBACK_PERMISSIONS.manageAll);

  if (!canRead) return <ForbiddenView />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <PageFeedbackTable
        canUpdate={canUpdate}
        canDelete={canDelete}
        canThank={canThank}
        showOwner={canManageAll && routeContext === "admin"}
        routeContext={routeContext}
      />
    </div>
  );
}
