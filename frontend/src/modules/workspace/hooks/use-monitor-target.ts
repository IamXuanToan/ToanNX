"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { monitorTargetService } from "../services/monitor-target.service";

/** @returns Chi tiết một endpoint giám sát Uptime. */
export function useMonitorTarget(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.monitorTargets.detail(id ?? ""),
    queryFn: ({ signal }) => monitorTargetService.get(id ?? "", signal),
    enabled: Boolean(id) && enabled,
  });
}
