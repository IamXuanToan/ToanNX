"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { monitorTargetService } from "../services/monitor-target.service";
import type { MonitorTarget, MonitorTargetInput } from "../types/monitor-target.types";

/** @param id - Có ID thì sửa endpoint Uptime, không thì tạo mới. */
export function useSaveMonitorTarget(id?: string) {
  return useResourceMutation<MonitorTargetInput, MonitorTarget>({
    mutationFn: (input) =>
      id ? monitorTargetService.update(id, input) : monitorTargetService.create(input),
    invalidate: [workspaceKeys.all],
    toastError: false,
  });
}
