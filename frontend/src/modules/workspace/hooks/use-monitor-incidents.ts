"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { monitorIncidentService } from "../services/monitor-incident.service";
import type { MonitorIncidentFilters } from "../types/monitor-incident.types";

/** @returns Danh sách Sự cố Uptime (DOWN → RECOVERED). */
export function useMonitorIncidents(
  filters: MonitorIncidentFilters,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.monitorIncidents.list(filters),
    (signal) => monitorIncidentService.list(filters, signal),
    options,
  );
}
