"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { useFinanceRoutes } from "../../hooks/use-finance-routes";
import { useInvoice } from "../../hooks/use-invoice";
import { InvoiceForm } from "./invoice-form";

/** @param props - Id, quyền sửa, slot lịch sử. @returns Chi tiết hóa đơn. */
export function InvoiceProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("finance.invoices");
  const routes = useFinanceRoutes();
  const query = useInvoice(id);
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={routes.invoices}
      />
    );
  return (
    <FormPage title={`${t(`docType.${query.data.docType}`)} ${query.data.number}`.trim()}>
      <InvoiceForm invoice={query.data} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
