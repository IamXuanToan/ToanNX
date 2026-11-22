"use client";

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { notificationKeys } from "../constants/query-keys";
import { announcementService } from "../services/announcement.service";
import type { SystemAnnouncement, SystemAnnouncementInput } from "../types/notification.types";

/** @returns Mutation gửi thông báo hệ thống. */
export function useCreateAnnouncement() {
  return useResourceMutation<SystemAnnouncementInput, SystemAnnouncement>({
    mutationFn: (input) => announcementService.create(input),
    invalidate: [notificationKeys.all],
    success: "saved",
  });
}
