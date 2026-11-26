"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { monitorTargetService } from "../services/monitor-target.service";

/** @returns Mutation xóa mềm một endpoint Uptime. */
export function useDeleteMonitorTarget() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => monitorTargetService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
