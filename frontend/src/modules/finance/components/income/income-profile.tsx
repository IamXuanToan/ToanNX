"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { FINANCE_ROUTES } from "../../constants/routes";
import { useIncome } from "../../hooks/use-income";
import { useRecalculateIncomeTax } from "../../hooks/use-recalculate-income-tax";
import { useRefreshIncomeRate } from "../../hooks/use-refresh-income-rate";
import { IncomeForm } from "./income-form";

/**
 * Chi tiết giao dịch: form + nút "Tính lại theo nền tảng" (bỏ thuế tay), "Lấy lại tỷ giá" (tỷ giá tự động).
 *
 * @param props - Id, quyền sửa, slot lịch sử.
 * @returns Trang chi tiết.
 */
export function IncomeProfile({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("finance.incomes");
  const query = useIncome(id);
  const recalculate = useRecalculateIncomeTax();
  const refreshRate = useRefreshIncomeRate();
  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError)
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={FINANCE_ROUTES.incomes}
      />
    );
  const income = query.data;
  return (
    <FormPage
      title={t("detailTitle", { date: income.receivedDate })}
      actions={
        canUpdate ? (
          <div className="flex gap-2">
            {income.rateSource === "API" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => refreshRate.mutate(id)}
                disabled={refreshRate.isPending}
              >
                <RefreshCw />
                {t("actions.refreshRate")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => recalculate.mutate({ ids: [id], resetManual: true })}
              disabled={recalculate.isPending}
            >
              {t("actions.recalculate")}
            </Button>
          </div>
        ) : null
      }
    >
      <IncomeForm income={income} disabled={!canUpdate} />
      {history ? <div className="mt-6">{history}</div> : null}
    </FormPage>
  );
}
