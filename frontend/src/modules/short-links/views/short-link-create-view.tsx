"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/auth/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { ShortLinkForm } from "../components/short-link-form/short-link-form";
import { SHORT_LINKS_PERMISSIONS } from "../constants/short-links-permissions";

/** Trang tạo link rút gọn. */
export function ShortLinkCreateView() {
  const t = useTranslations("shortLinks");
  const canCreate = usePermission(SHORT_LINKS_PERMISSIONS.create);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <ShortLinkForm />
    </FormPage>
  );
}
