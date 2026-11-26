"use client";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";

import { workspaceKeys } from "../../../constants/query-keys";
import { useDeleteMonitorIncident } from "../../../hooks/use-delete-monitor-incident";
import { useMonitorIncidents } from "../../../hooks/use-monitor-incidents";
import { useMonitorTargetOptions } from "../../../hooks/use-monitor-target-options";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { MONITOR_INCIDENT_PERMISSIONS } from "../../../permissions/monitor-incident-permission";
import { monitorIncidentService } from "../../../services/monitor-incident.service";
import type { MonitorIncident } from "../../../types/monitor-incident.types";

const FILTER_KEYS = ["target", "resolved", "owner"] as const;

/** @returns State bảng Sự cố Uptime. */
export function useMonitorIncidentTable() {
  const ownerFilter = useWorkspaceOwnerOptions(MONITOR_INCIDENT_PERMISSIONS.manageAll);
  const targets = useMonitorTargetOptions();
  const table = useTableState({ ordering: "-started_at", filterKeys: FILTER_KEYS });
  const resolvedRaw = table.extraFilters.resolved;
  const query = useMonitorIncidents({
    ...table.filters,
    target: table.extraFilters.target || undefined,
    resolved: resolvedRaw === "true" ? true : resolvedRaw === "false" ? false : undefined,
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const remove = useDeleteMonitorIncident();
  const bulk = useBulkActions<MonitorIncident>({
    service: monitorIncidentService,
    invalidate: [workspaceKeys.all],
  });

  return {
    table,
    query,
    ...ownerFilter,
    targetOptions: targets.options,
    remove: (item: MonitorIncident) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
