"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";

import { workspaceKeys } from "../constants/query-keys";
import { workspaceCalendarService } from "../services/workspace-calendar.service";
import type { WorkspaceCalendarParams } from "../types/workspace-calendar.types";

/** @returns Danh sách sự kiện hợp nhất trên Lịch cá nhân theo khoảng ngày. */
export function useWorkspaceCalendar(
  params: WorkspaceCalendarParams,
  options: { enabled?: boolean } = {},
) {
  return useListQuery(
    workspaceKeys.calendar(params),
    (signal) => workspaceCalendarService.get(params, signal),
    options,
  );
}
