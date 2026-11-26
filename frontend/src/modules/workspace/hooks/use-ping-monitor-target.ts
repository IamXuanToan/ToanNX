"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { monitorTargetService } from "../services/monitor-target.service";
import type { MonitorPingResult } from "../types/monitor-target.types";

/** @returns Mutation ping thử endpoint ngay lập tức. */
export function usePingMonitorTarget() {
  return useResourceMutation<string, MonitorPingResult>({
    mutationFn: (id) => monitorTargetService.ping(id),
    invalidate: [workspaceKeys.all],
    success: false,
  });
}
