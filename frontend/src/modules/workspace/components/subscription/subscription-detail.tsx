"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

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
  const tCommon = useTranslations("workspace.common");
  const state = useSubscriptionDetail(id);
  const { query, activeTab, setActiveTab } = state;

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
      actions={
        canRenew ? (
          <Button type="button" variant="outline" onClick={() => state.setRenewOpen(true)}>
            <RefreshCw />
            {t("renew")}
          </Button>
        ) : null
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="general">{tCommon("tabGeneral")}</TabsTrigger>
          <TabsTrigger value="payments">
            {t("tabPayments", { count: state.paymentCount })}
          </TabsTrigger>
          {history ? <TabsTrigger value="history">{tCommon("tabHistory")}</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <SubscriptionForm subscription={query.data} disabled={!canUpdate} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <SubscriptionPaymentsTab subscriptionId={query.data.id} canDelete={canDeletePayment} />
        </TabsContent>
        {history ? (
          <TabsContent value="history" className="mt-4">
            {history}
          </TabsContent>
        ) : null}
      </Tabs>

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
