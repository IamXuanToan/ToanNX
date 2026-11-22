"use client";

import { useListQuery } from "@/shares/hooks/use-list-query";
import type { ListParams } from "@/shares/types/api.types";

import { notificationKeys } from "../constants/query-keys";
import { announcementService } from "../services/announcement.service";

/** @param filters - Bộ lọc. @returns Thông báo hệ thống đã gửi. */
export function useAnnouncements(filters: ListParams) {
  return useListQuery(notificationKeys.announcements.list(filters), (signal) =>
    announcementService.list(filters, signal),
  );
}
