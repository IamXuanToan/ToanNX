"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { monitorTargetService } from "../services/monitor-target.service";
import type { MonitorTargetFilters } from "../types/monitor-target.types";

/** @returns Danh sách endpoint giám sát Uptime/HTTP. */
export function useMonitorTargets(
  filters: MonitorTargetFilters,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.monitorTargets.list(filters),
    (signal) => monitorTargetService.list(filters, signal),
    options,
  );
}
