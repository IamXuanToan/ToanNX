"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { RecordDetailTabs } from "@/shares/components/common/record-detail-tabs";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useSubscriptionDetail } from "./hooks/use-subscription-detail";
import { SubscriptionForm } from "./subscription-form";
import { SubscriptionPaymentsTab } from "./subscription-payments-tab";
import { SubscriptionRenewDialog } from "./subscription-renew-dialog";

/**
 * Trang chi tiết Dịch vụ định kỳ: 3 tab (`general`, `payments`, `history`) đồng bộ `?tab=`
 * kèm nút Gia hạn ngay trên header.
 *
 * @param props - ID dịch vụ, quyền sửa, slot lịch sử.
 * @returns Chi tiết Dịch vụ định kỳ.
 */
export function SubscriptionDetail({
  id,
  canUpdate,
  canRenew,
  canDeletePayment = false,
  history,
}: {
  id: string;
  canUpdate: boolean;
  canRenew: boolean;
  canDeletePayment?: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("workspace.subscriptions");
  const state = useSubscriptionDetail(id);
  const { query } = state;

  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={WORKSPACE_ROUTES.subscriptions}
      />
    );
  }

  return (
    <FormPage
      title={query.data.name || t("editTitle")}
      backHref={WORKSPACE_ROUTES.subscriptions}
      actions={
        canRenew ? (
          <Button type="button" variant="outline" onClick={() => state.setRenewOpen(true)}>
            <RefreshCw />
            {t("renew")}
          </Button>
        ) : null
      }
    >
      <RecordDetailTabs
        general={<SubscriptionForm subscription={query.data} disabled={!canUpdate} />}
        extraTabs={[
          {
            value: "payments",
            label: t("tabPayments", { count: state.paymentCount }),
            content: (
              <SubscriptionPaymentsTab
                subscriptionId={query.data.id}
                canDelete={canDeletePayment}
              />
            ),
          },
        ]}
        history={history}
      />

      {state.renewOpen ? (
        <SubscriptionRenewDialog
          subscription={query.data}
          open={state.renewOpen}
          onOpenChange={state.setRenewOpen}
        />
      ) : null}
    </FormPage>
  );
}
