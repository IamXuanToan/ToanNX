"use client";

import type { ComponentProps, ReactNode } from "react";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { withEditMode } from "@/shares/lib/edit-mode";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useCurrentUser } from "../../hooks/use-current-user";
import { useEmailTemplate } from "../../hooks/use-email-template";
import { EmailTemplateForm } from "./email-template-form";

/**
 * Hồ sơ chi tiết mẫu email: tải bản ghi, kiểm quyền sửa theo phạm vi (`SYSTEM` / `PERSONAL`),
 * nút chuyển sang chế độ chỉnh sửa và tab lịch sử thay đổi (`?tab=history`).
 *
 * @param props - ID bản ghi, quyền quản lý toàn hệ thống, slot lịch sử và ngữ cảnh điều hướng.
 * @returns Giao diện chi tiết mẫu email.
 */
export function EmailTemplateProfile({
  id,
  canUpdate,
  isEditing,
  canManageAll,
  history,
  routeContext = "admin",
}: {
  id: string;
  canUpdate: boolean;
  isEditing: boolean;
  canManageAll: boolean;
  history?: ReactNode;
  routeContext?: "admin" | "portal";
}) {
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const query = useEmailTemplate(id);

  const resolvedBackHref = (
    routeContext === "portal" ? "/portal/email-templates" : SYSTEM_ROUTES.emailTemplates
  ) as ComponentProps<typeof Link>["href"];

  if (query.isPending) {
    return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  }

  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={resolvedBackHref}
      />
    );
  }

  const template = query.data;
  const canModify =
    canUpdate &&
    (canManageAll ||
      (template.scope === "PERSONAL" && template.owner?.id === currentUser?.user.id));

  const targetRoute =
    routeContext === "portal"
      ? { pathname: "/portal/email-templates/[id]" as const, params: { id } }
      : SYSTEM_ROUTES.emailTemplateDetail(id);

  return (
    <FormPage
      title={template.name}
      backHref={resolvedBackHref}
      actions={
        <div className="flex items-center gap-2">
          <FormBackButton href={resolvedBackHref} />
          {canModify && !isEditing ? (
            <Button asChild size="sm">
              <Link href={withEditMode(targetRoute) as ComponentProps<typeof Link>["href"]}>
                <Pencil className="mr-2 size-4" />
                {tCommon("actions.edit")}
              </Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <RecordDetailTabs
        general={
          <EmailTemplateForm
            initial={template}
            canManageAll={canManageAll}
            canEdit={isEditing && canModify}
            routeContext={routeContext}
            onSuccess={() => {
              router.replace(targetRoute as Parameters<typeof router.replace>[0]);
            }}
          />
        }
        history={history}
      />
    </FormPage>
  );
}
