"use client";

import { useRouter } from "@/i18n/navigation";
import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { workspaceKeys } from "../../../constants/query-keys";
import { WORKSPACE_ROUTES } from "../../../constants/routes";
import { useDeleteReminder } from "../../../hooks/use-delete-reminder";
import { useReminderTopics } from "../../../hooks/use-reminder-topics";
import { useReminders } from "../../../hooks/use-reminders";
import { useWorkspaceOwnerOptions } from "../../../hooks/use-workspace-owner-options";
import { REMINDER_PERMISSIONS } from "../../../permissions/reminder-permission";
import { reminderService } from "../../../services/reminder.service";
import type { Reminder, ReminderPriority, ReminderRecurrence } from "../../../types/reminder.types";

const FILTER_KEYS = ["priority", "isCompleted", "recurrence", "topic", "owner"] as const;

/** @returns State bảng Nhắc việc cá nhân đồng bộ URL. */
export function useReminderTable() {
  const router = useRouter();
  const ownerFilter = useWorkspaceOwnerOptions(REMINDER_PERMISSIONS.manageAll);
  const topicsQuery = useReminderTopics({ pageSize: 100 });
  const table = useTableState({ ordering: "due_date", filterKeys: FILTER_KEYS });
  const isCompletedRaw = table.extraFilters.isCompleted;
  const query = useReminders({
    ...table.filters,
    priority: table.getFilterValues("priority") as ReminderPriority[],
    isCompleted: isCompletedRaw === "true" ? true : isCompletedRaw === "false" ? false : undefined,
    recurrence: table.getFilterValues("recurrence") as ReminderRecurrence[],
    topic: table.getFilterValues("topic"),
    owner: ownerFilter.canFilterOwner ? table.extraFilters.owner : undefined,
  });
  const remove = useDeleteReminder();
  const toggleCompleted = useResourceMutation<{ id: string; isCompleted: boolean }, Reminder>({
    mutationFn: ({ id, isCompleted }) => reminderService.update(id, { isCompleted }),
    invalidate: [workspaceKeys.all],
  });
  const bulk = useBulkActions<Reminder>({
    service: reminderService,
    invalidate: [workspaceKeys.all],
  });

  return {
    table,
    query,
    topicOptions: (topicsQuery.data?.items ?? []).map((topic) => ({
      value: topic.id,
      label: topic.name,
    })),
    ...ownerFilter,
    toggleCompleted: (item: Reminder, isCompleted: boolean) =>
      toggleCompleted.mutate({ id: item.id, isCompleted }),
    bulkSetCompleted: (rows: Reminder[], isCompleted: boolean) =>
      bulk.bulkUpdate(rows, { isCompleted }),
    view: (item: Reminder) => router.push(WORKSPACE_ROUTES.reminderDetail(item.id)),
    edit: (item: Reminder) => router.push(withEditMode(WORKSPACE_ROUTES.reminderDetail(item.id))),
    remove: (item: Reminder) => remove.mutateAsync(item.id),
    bulkDelete: bulk.bulkDelete,
  };
}
