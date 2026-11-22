"use client";

import { useTableState } from "@/shares/hooks/use-table-state";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { notificationKeys } from "../../constants/query-keys";
import { announcementService } from "../../services/announcement.service";
import { useAnnouncements } from "../../hooks/use-announcements";
import { useDeleteAnnouncement } from "../../hooks/use-delete-announcement";
import type { SystemAnnouncement } from "../../types/notification.types";

/** @returns State bảng thông báo hệ thống + thu hồi. */
export function useAnnouncementTable() {
  const table = useTableState({ ordering: "-created_at" });
  const query = useAnnouncements(table.filters);
  const remove = useDeleteAnnouncement();
  const bulk = useBulkActions<SystemAnnouncement>({
    service: announcementService,
    invalidate: [notificationKeys.all],
  });
  return {
    bulkDelete: bulk.bulkDelete,
    table,
    query,
    remove: (row: SystemAnnouncement) => remove.mutateAsync(row.id),
  };
}
