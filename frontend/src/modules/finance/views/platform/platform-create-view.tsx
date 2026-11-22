"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { PlatformForm } from "../../components/platform/platform-form";
import { PLATFORM_PERMISSIONS } from "../../permissions/platform-permission";

/** Trang tạo (finance.platforms). */
export function PlatformCreateView() {
  const t = useTranslations("finance.platforms");
  if (!usePermission(PLATFORM_PERMISSIONS.create)) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <PlatformForm />
    </FormPage>
  );
}
