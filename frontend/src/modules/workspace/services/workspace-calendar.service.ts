import { apiClient } from "@/shares/lib/api/api-client";

import { WORKSPACE_API_ENDPOINTS } from "../constants/api-endpoints";
import type { WorkspaceCalendar, WorkspaceCalendarParams } from "../types/workspace-calendar.types";

/** Service Lịch tổng hợp cá nhân (BE `workspace_calendar_service.py`). */
export const workspaceCalendarService = {
  async get(params: WorkspaceCalendarParams, signal?: AbortSignal): Promise<WorkspaceCalendar> {
    return (
      await apiClient.get<WorkspaceCalendar>(WORKSPACE_API_ENDPOINTS.calendar, {
        query: {
          from: params.fromDate,
          to: params.toDate,
          types: params.types?.length ? params.types : undefined,
          owner: params.ownerId ?? undefined,
        },
        signal,
      })
    ).data;
  },
};
