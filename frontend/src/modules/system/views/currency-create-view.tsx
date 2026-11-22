"use client";

import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { CurrencyForm } from "../components/currency-form";
import { usePermission } from "../hooks/use-permission";
import { CURRENCY_PERMISSIONS } from "../permissions/currency-permission";

/** Trang thêm tiền tệ. */
export function CurrencyCreateView() {
  const t = useTranslations("system.currencies");
  if (!usePermission(CURRENCY_PERMISSIONS.create)) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <CurrencyForm />
    </FormPage>
  );
}
