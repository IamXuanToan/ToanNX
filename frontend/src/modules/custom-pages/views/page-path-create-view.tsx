"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PagePathForm } from "../components/page-path-form/page-path-form";
import { PAGE_PATH_PERMISSIONS } from "../permissions/page-path-permission";

/** Trang tạo đường dẫn giữa. */
export function PagePathCreateView() {
  const t = useTranslations("customPages.paths");
  const canCreate = usePermission(PAGE_PATH_PERMISSIONS.pathCreate);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <PagePathForm />
    </FormPage>
  );
}
