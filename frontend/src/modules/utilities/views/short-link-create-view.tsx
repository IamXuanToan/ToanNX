"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { ShortLinkForm } from "../components/short-link-form";
import { SHORT_LINK_PERMISSIONS } from "../permissions/short-link-permission";

/** Trang tạo link rút gọn. */
export function ShortLinkCreateView() {
  const t = useTranslations("utilities.shortLinks");
  const canCreate = usePermission(SHORT_LINK_PERMISSIONS.create);
  if (!canCreate) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <ShortLinkForm />
    </FormPage>
  );
}
