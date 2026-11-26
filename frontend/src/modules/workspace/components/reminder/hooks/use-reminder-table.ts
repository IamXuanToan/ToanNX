"use client";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { workspaceKeys } from "../../../constants/query-keys";
import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useDeleteReminder } from "../../../hooks/use-delete-reminder";
import { useReminders } from "../../../hooks/use-reminders";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { REMINDER_PERMISSIONS } from "../../../permissions/reminder-permission";
import { reminderService } from "../../../services/reminder.service";
import type { Reminder } from "../../../types/reminder.types";

const FILTER_KEYS = ["priority", "isCompleted", "recurrence", "owner"] as const;

/** @returns State bảng Nhắc việc cá nhân đồng bộ URL. */
export function useReminderTable() {
  const router = useRouter();
  const ownerFilter = useWorkspaceOwnerOptions(REMINDER_PERMISSIONS.manageAll);
  const table = useTableState({ ordering: "due_date", filterKeys: FILTER_KEYS });
  const isCompletedRaw = table.extraFilters.isCompleted;
  const query = useReminders({
    ...table.filters,
    priority: table.getFilterValues("priority"),
    isCompleted: isCompletedRaw === "true" ? true : isCompletedRaw === "false" ? false : undefined,
    recurrence: table.getFilterValues("recurrence"),
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const remove = useDeleteReminder();
  const bulk = useBulkActions<Reminder>({
    service: reminderService,
    invalidate: [workspaceKeys.all],
  });

  return {
    table,
    query,
    ...ownerFilter,
    toggleCompleted: async (item: Reminder, isCompleted: boolean) => {
      await reminderService.update(item.id, { isCompleted });
      await query.refetch();
    },
    bulkSetCompleted: (rows: Reminder[], isCompleted: boolean) =>
      bulk.bulkUpdate(rows, { isCompleted }),
    view: (item: Reminder) => router.push(WORKSPACE_ROUTES.reminderDetail(item.id)),
    edit: (item: Reminder) => router.push(withEditMode(WORKSPACE_ROUTES.reminderDetail(item.id))),
    remove: (item: Reminder) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
