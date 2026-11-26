"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { monitorTargetService } from "../services/monitor-target.service";

/** @returns Danh sách endpoint Uptime dạng option `{ value, label }`. */
export function useMonitorTargetOptions(enabled = true) {
  const query = useQuery({
    queryKey: workspaceKeys.monitorTargets.list({ ordering: "name" }),
    queryFn: ({ signal }) => monitorTargetService.listAll({ ordering: "name" }, signal),
    enabled,
  });
  return {
    ...query,
    options: (query.data ?? []).map((item) => ({
      value: item.id,
      label: item.name,
    })),
  };
}
