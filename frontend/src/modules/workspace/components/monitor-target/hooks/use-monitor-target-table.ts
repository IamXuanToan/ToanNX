"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { workspaceKeys } from "../../../constants/query-keys";
import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useDeleteMonitorTarget } from "../../../hooks/use-delete-monitor-target";
import { useMonitorTargets } from "../../../hooks/use-monitor-targets";
import { usePingMonitorTarget } from "../../../hooks/use-ping-monitor-target";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { MONITOR_TARGET_PERMISSIONS } from "../../../permissions/monitor-target-permission";
import { monitorTargetService } from "../../../services/monitor-target.service";
import type { MonitorTarget } from "../../../types/monitor-target.types";

const FILTER_KEYS = ["lastStatus", "isActive", "method", "owner"] as const;

/** @returns State bảng Endpoint Uptime + ping tức thời. */
export function useMonitorTargetTable() {
  const t = useTranslations("workspace.monitors");
  const router = useRouter();
  const ownerFilter = useWorkspaceOwnerOptions(MONITOR_TARGET_PERMISSIONS.manageAll);
  const table = useTableState({ ordering: "name", filterKeys: FILTER_KEYS });
  const isActiveRaw = table.extraFilters.isActive;
  const query = useMonitorTargets({
    ...table.filters,
    lastStatus: table.getFilterValues("lastStatus"),
    isActive: isActiveRaw === "true" ? true : isActiveRaw === "false" ? false : undefined,
    method: table.getFilterValues("method"),
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const ping = usePingMonitorTarget();
  const remove = useDeleteMonitorTarget();
  const bulk = useBulkActions<MonitorTarget>({
    service: monitorTargetService,
    invalidate: [workspaceKeys.all],
  });
  const [pingingId, setPingingId] = useState<string | null>(null);

  return {
    table,
    query,
    ...ownerFilter,
    pingingId,
    pingNow: async (item: MonitorTarget) => {
      setPingingId(item.id);
      try {
        const res = await ping.mutateAsync(item.id);
        if (res.status === "HEALTHY") {
          toast.success(
            t("pingSuccess", { code: res.statusCode ?? 200, latency: res.latencyMs ?? 0 }),
          );
        } else {
          toast.warning(t("pingDown", { error: res.errorMessage || `HTTP ${res.statusCode}` }));
        }
      } finally {
        setPingingId(null);
      }
    },
    toggleActive: async (item: MonitorTarget, isActive: boolean) => {
      await monitorTargetService.update(item.id, { isActive });
      await query.refetch();
    },
    bulkSetActive: (rows: MonitorTarget[], isActive: boolean) =>
      bulk.bulkUpdate(rows, { isActive }),
    view: (item: MonitorTarget) => router.push(WORKSPACE_ROUTES.monitorDetail(item.id)),
    edit: (item: MonitorTarget) =>
      router.push(withEditMode(WORKSPACE_ROUTES.monitorDetail(item.id))),
    remove: (item: MonitorTarget) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
