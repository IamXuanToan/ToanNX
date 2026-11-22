"use client";

import { useTranslations } from "next-intl";

import { usePermission } from "@/modules/system/hooks/use-permission";
import { FormPage } from "@/shares/components/common/form-page";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { InvoiceForm } from "../components/invoice-form";
import { INVOICE_PERMISSIONS } from "../permissions/invoice-permission";

/** Trang tạo (finance.invoices). */
export function InvoiceCreateView() {
  const t = useTranslations("finance.invoices");
  if (!usePermission(INVOICE_PERMISSIONS.create)) return <ForbiddenView />;
  return (
    <FormPage title={t("create")}>
      <InvoiceForm />
    </FormPage>
  );
}
