"use client";

import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { ExchangeRateForm } from "../../components/exchange-rate/exchange-rate-form";
import { usePermission } from "../../hooks/use-permission";
import { EXCHANGE_RATE_PERMISSIONS } from "../../permissions/exchange-rate-permission";

/** Trang nhập tay tỷ giá. */
export function ExchangeRateCreateView() {
  const t = useTranslations("system.exchangeRates");
  if (!usePermission(EXCHANGE_RATE_PERMISSIONS.create)) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <ExchangeRateForm />
    </FormPage>
  );
}
