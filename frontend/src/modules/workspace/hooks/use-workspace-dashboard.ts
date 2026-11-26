"use client";

import { useQuery } from "@tanstack/react-query";

import { workspaceKeys } from "../constants/query-keys";
import { workspaceDashboardService } from "../services/workspace-dashboard.service";

/** @returns Số liệu tổng quan Không gian cá nhân + nhắc việc hôm nay. */
export function useWorkspaceDashboard(ownerId?: string | null, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.dashboardSummary(ownerId),
    queryFn: ({ signal }) => workspaceDashboardService.summary(ownerId, signal),
    enabled,
  });
}
