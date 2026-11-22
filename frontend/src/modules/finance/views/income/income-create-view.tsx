"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { IncomeForm } from "../../components/income/income-form";
import { INCOME_PERMISSIONS } from "../../permissions/income-permission";

/** Trang tạo (finance.incomes). */
export function IncomeCreateView() {
  const t = useTranslations("finance.incomes");
  if (!usePermission(INCOME_PERMISSIONS.create)) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <IncomeForm />
    </FormPage>
  );
}
