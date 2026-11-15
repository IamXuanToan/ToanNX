"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PageForm } from "../components/page-form/page-form";
import { CUSTOM_PAGES_PERMISSIONS as P } from "../constants/custom-pages-permissions";

/** Trang tạo trang: chọn đường dẫn giữa, slug, tiêu đề, mẫu bắt đầu; tạo xong vào màn soạn. */
export function PageCreateView() {
  const t = useTranslations("customPages.pages");
  const canCreate = usePermission(P.create);
  const canCreatePath = usePermission(P.pathCreate);
  const canUpdatePath = usePermission(P.pathUpdate);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <PageForm canCreatePath={canCreatePath} canUpdatePath={canUpdatePath} />
    </FormPage>
  );
}
