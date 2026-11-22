"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { announcementService } from "../services/announcement.service";

/** @returns Mutation thu hồi thông báo hệ thống. */
export function useDeleteAnnouncement() {
  return useResourceMutation<string, void>({
    mutationFn: (id) => announcementService.delete(id),
    invalidate: [notificationKeys.all],
    success: "deleted",
  });
}
