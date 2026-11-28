"use client";

import { useTranslations } from "next-intl";

import { FormBackButton } from "@/shares/components/common/form-back-button";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { LanguageForm } from "../../components/language/language-form";
import { SYSTEM_ROUTES } from "../../constants/routes";
import { usePermission } from "../../hooks/use-permission";
import { LANGUAGE_PERMISSIONS } from "../../permissions/language-permission";

/**
 * Màn hình thêm ngôn ngữ mới vào hệ thống.
 *
 * @returns Trang tạo ngôn ngữ hoặc `ForbiddenView`.
 */
export function LanguageCreateView() {
  const t = useTranslations("system.languages");
  const canCreate = usePermission(LANGUAGE_PERMISSIONS.create);

  if (!canCreate) return <ForbiddenView />;

  return (
    <FormPage
      title={t("createTitle")}
      backHref={SYSTEM_ROUTES.languages}
      actions={<FormBackButton href={SYSTEM_ROUTES.languages} />}
    >
      <LanguageForm />
    </FormPage>
  );
}
