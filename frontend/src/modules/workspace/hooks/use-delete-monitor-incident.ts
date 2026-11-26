"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { workspaceKeys } from "../constants/query-keys";
import { monitorIncidentService } from "../services/monitor-incident.service";

/** @returns Mutation xóa mềm một bản ghi Sự cố Uptime. */
export function useDeleteMonitorIncident() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => monitorIncidentService.delete(id),
    invalidate: [workspaceKeys.all],
    success: "deleted",
  });
}
