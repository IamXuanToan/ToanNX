"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PageForm } from "../../components/page/page-form";
import { PAGE_PATH_PERMISSIONS } from "../../permissions/page-path-permission";
import { PAGE_PERMISSIONS } from "../../permissions/page-permission";

/** Trang tạo trang: chọn đường dẫn giữa, slug, tiêu đề, mẫu bắt đầu; tạo xong vào màn soạn. */
export function PageCreateView() {
  const t = useTranslations("utilities.customPages.pages");
  const canCreate = usePermission(PAGE_PERMISSIONS.create);
  const canCreatePath = usePermission(PAGE_PATH_PERMISSIONS.create);
  const canUpdatePath = usePermission(PAGE_PATH_PERMISSIONS.update);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <PageForm canCreatePath={canCreatePath} canUpdatePath={canUpdatePath} />
    </FormPage>
  );
}
