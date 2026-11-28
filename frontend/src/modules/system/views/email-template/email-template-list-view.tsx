"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";
import { Button } from "@/shares/components/ui/button";

import { EmailTemplateTable } from "../../components/email-template/email-template-table";
import { SYSTEM_ROUTES } from "../../constants/routes";
import { usePermission } from "../../hooks/use-permission";
import { EMAIL_TEMPLATE_PERMISSIONS } from "../../permissions/email-template-permission";

/**
 * Màn hình danh sách mẫu email (dùng chung cho Admin và Client Portal).
 *
 * @param props - Ngữ cảnh điều hướng (`admin` hoặc `portal`).
 * @returns Danh sách mẫu email hoặc `ForbiddenView`.
 */
export function EmailTemplateListView({
  routeContext = "admin",
}: {
  routeContext?: "admin" | "portal";
}) {
  const t = useTranslations("system.emailTemplates");
  const canRead = usePermission(EMAIL_TEMPLATE_PERMISSIONS.read);
  const canCreate = usePermission(EMAIL_TEMPLATE_PERMISSIONS.create);
  const canUpdate = usePermission(EMAIL_TEMPLATE_PERMISSIONS.update);
  const canDelete = usePermission(EMAIL_TEMPLATE_PERMISSIONS.delete);
  const canManageAll = usePermission(EMAIL_TEMPLATE_PERMISSIONS.manageAll);

  if (!canRead) return <ForbiddenView />;

  const createHref =
    routeContext === "portal" ? "/portal/email-templates/new" : SYSTEM_ROUTES.emailTemplateCreate;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href={createHref}>
                <Plus className="mr-2 size-4" />
                {t("actions.create")}
              </Link>
            </Button>
          ) : null
        }
      />

      <EmailTemplateTable
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canManageAll={canManageAll}
        showOwner={canManageAll && routeContext === "admin"}
        routeContext={routeContext}
      />
    </div>
  );
}
