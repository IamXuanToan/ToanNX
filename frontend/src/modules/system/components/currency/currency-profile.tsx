"use client";

import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { SYSTEM_ROUTES } from "../../constants/routes";
import { useCurrency } from "../../hooks/use-currency";
import { CurrencyForm } from "./currency-form";

/** @param props - Id, quyền sửa, slot lịch sử. @returns Chi tiết tiền tệ (form dùng chung với trang tạo). */
export function CurrencyProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const query = useCurrency(id);
  if (query.isPending) return <Skeleton className="mx-auto h-64 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={SYSTEM_ROUTES.currencies}
      />
    );
  return (
    <FormPage title={`${query.data.code} · ${query.data.name}`} backHref={SYSTEM_ROUTES.currencies}>
      <RecordDetailTabs
        general={<CurrencyForm currency={query.data} disabled={!canUpdate} />}
        history={history}
      />
    </FormPage>
  );
}
