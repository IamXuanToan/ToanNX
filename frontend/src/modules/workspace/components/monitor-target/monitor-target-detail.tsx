"use client";

import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { FormPage } from "@/shares/components/common/form-page";
import { QueryErrorState } from "@/shares/components/errors/query-error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import { useMonitorTargetDetail } from "./hooks/use-monitor-target-detail";
import { MonitorIncidentsTab } from "./monitor-incidents-tab";
import { MonitorTargetForm } from "./monitor-target-form";

/**
 * Trang chi tiết Endpoint giám sát Uptime: 3 tab (`general`, `incidents`, `history`) đồng bộ `?tab=`
 * kèm nút Ping ngay trên header khi có quyền sửa.
 *
 * @param props - ID endpoint, quyền sửa, slot lịch sử.
 * @returns Chi tiết endpoint Uptime.
 */
export function MonitorTargetDetail({
  id,
  canUpdate,
  history,
}: {
  id: string;
  canUpdate: boolean;
  history?: ReactNode;
}) {
  const t = useTranslations("workspace.monitors");
  const tCommon = useTranslations("workspace.common");
  const state = useMonitorTargetDetail(id);
  const { query, activeTab, setActiveTab } = state;

  if (query.isPending) return <Skeleton className="mx-auto h-96 w-full max-w-6xl rounded-xl" />;
  if (query.isError) {
    return (
      <QueryErrorState
        error={query.error}
        onRetry={() => query.refetch()}
        backHref={WORKSPACE_ROUTES.monitors}
      />
    );
  }

  return (
    <FormPage
      title={query.data.name || t("editTitle")}
      actions={
        canUpdate ? (
          <Button
            type="button"
            variant="outline"
            disabled={state.isPinging}
            onClick={() => void state.pingNow()}
          >
            <Activity />
            {t("pingNow")}
          </Button>
        ) : null
      }
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="general">{tCommon("tabGeneral")}</TabsTrigger>
          <TabsTrigger value="incidents">
            {t("tabIncidents", { count: state.incidentCount })}
          </TabsTrigger>
          {history ? <TabsTrigger value="history">{tCommon("tabHistory")}</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <MonitorTargetForm target={query.data} disabled={!canUpdate} />
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <MonitorIncidentsTab targetId={query.data.id} />
        </TabsContent>
        {history ? (
          <TabsContent value="history" className="mt-4">
            {history}
          </TabsContent>
        ) : null}
      </Tabs>
    </FormPage>
  );
}
