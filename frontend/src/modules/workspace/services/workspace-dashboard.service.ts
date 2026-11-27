import { apiClient } from "@/shares/lib/api/api-client";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { WorkspaceDashboardSummary } from "../types/workspace-dashboard.types";

/** Service thống kê tổng quan Không gian cá nhân (BE `workspace_dashboard_service.py`). */
export const workspaceDashboardService = {
  async summary(ownerId?: string | null, signal?: AbortSignal): Promise<WorkspaceDashboardSummary> {
    return (
      await apiClient.get<WorkspaceDashboardSummary>(WORKSPACE_API_ENDPOINTS.dashboardSummary, {
        query: ownerId ? { ownerId } : undefined,
        signal,
      })
    ).data;
  },
};
