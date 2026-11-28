"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { EmailTemplateForm } from "../../components/email-template/email-template-form";
import { SYSTEM_ROUTES } from "../../constants/routes";
import { usePermission } from "../../hooks/use-permission";
import { EMAIL_TEMPLATE_PERMISSIONS } from "../../permissions/email-template-permission";

/**
 * Màn hình tạo mới mẫu email (Admin hoặc Client Portal).
 *
 * @param props - Ngữ cảnh điều hướng (`admin` hoặc `portal`).
 * @returns Trang tạo mẫu email hoặc `ForbiddenView`.
 */
export function EmailTemplateCreateView({
  routeContext = "admin",
}: {
  routeContext?: "admin" | "portal";
}) {
  const t = useTranslations("system.emailTemplates");
  const canCreate = usePermission(EMAIL_TEMPLATE_PERMISSIONS.create);
  const canManageAll = usePermission(EMAIL_TEMPLATE_PERMISSIONS.manageAll);

  if (!canCreate) return <ForbiddenView />;

  const backHref = (
    routeContext === "portal" ? "/portal/email-templates" : SYSTEM_ROUTES.emailTemplates
  ) as NonNullable<ComponentProps<typeof FormPage>["backHref"]>;

  return (
    <FormPage
      title={t("createTitle")}
      backHref={backHref}
      actions={<FormBackButton href={backHref} />}
    >
      <EmailTemplateForm
        canManageAll={canManageAll && routeContext === "admin"}
        routeContext={routeContext}
      />
    </FormPage>
  );
}
