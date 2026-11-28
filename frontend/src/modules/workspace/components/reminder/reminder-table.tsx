"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { AppTooltip } from "@/shares/components/common/app-tooltip";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge, type StatusTone } from "@/shares/components/common/status-badge";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { formatExplicitDate } from "@/shares/lib/date-time-format";
import { formatOwnerDisplayName, formatOwnerDisplayTooltip } from "@/shares/lib/user-display";

import { REMINDER_PRIORITIES, REMINDER_RECURRENCES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { Reminder, ReminderPriority } from "../../types/reminder.types";
import { useReminderTable } from "./hooks/use-reminder-table";

const PRIORITY_TONE: Record<ReminderPriority, StatusTone> = {
  LOW: "neutral",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "danger",
};

/** @param props - Quyền sửa/xóa. @returns Bảng Nhắc việc cá nhân. */
export function ReminderTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("workspace.reminders");
  const tCommon = useTranslations("workspace.common");
  const state = useReminderTable();
  const { table, query } = state;

  const columns: DataTableColumn<Reminder>[] = [
    {
      id: "title",
      header: t("fields.title"),
      sortKey: "title",
      mobile: "title",
      className: "md:w-full",
      cell: (item) => (
        <div className="min-w-0">
          <Link
            href={WORKSPACE_ROUTES.reminderDetail(item.id)}
            className="hover:text-primary font-medium underline-offset-4 hover:underline"
          >
            {item.title}
          </Link>
          {item.description ? (
            <p className="text-muted-foreground max-w-sm truncate text-xs">{item.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "topic",
      header: t("fields.topic"),
      hideBelow: "lg",
      cell: (item) =>
        item.topic ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.topic.color }}
            />
            <span className="max-w-32 truncate">{item.topic.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: "dueDate",
      header: t("fields.dueDate"),
      sortKey: "due_date",
      cell: (item) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatExplicitDate(item.dueDate)}
          {item.dueTime ? ` · ${item.dueTime.slice(0, 5)}` : ""}
        </span>
      ),
    },
    {
      id: "priority",
      header: t("fields.priority"),
      cell: (item) => (
        <StatusBadge tone={PRIORITY_TONE[item.priority]}>
          {t(`priorities.${item.priority}`)}
        </StatusBadge>
      ),
    },
    {
      id: "recurrence",
      header: t("fields.recurrence"),
      hideBelow: "lg",
      cell: (item) => t(`recurrences.${item.recurrence}`),
    },
    {
      id: "isCompleted",
      header: t("fields.isCompleted"),
      cell: (item) => (
        <TableStatusSwitch
          checked={item.isCompleted}
          onLabel={t("completed")}
          offLabel={t("pending")}
          aria-label={t("fields.isCompleted")}
          onCheckedChange={
            canUpdate ? (checked) => void state.toggleCompleted(item, checked) : undefined
          }
        />
      ),
    },
    ...(state.canManageAll
      ? [
          {
            id: "owner",
            header: tCommon("owner"),
            hideBelow: "xl" as const,
            cell: (item: Reminder) => {
              const ownerLabel = formatOwnerDisplayName(item);
              return (
                <AppTooltip content={formatOwnerDisplayTooltip(item)}>
                  <span className="text-muted-foreground block max-w-44 truncate">
                    {ownerLabel || "—"}
                  </span>
                </AppTooltip>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <DataTable
      tableId="workspace-reminders"
      columns={columns}
      rows={query.data?.items}
      getRowId={(item) => item.id}
      getRowLabel={(item) => item.title}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("fields.topic")}
            value={table.getFilterValues("topic")}
            onValueChange={(values) => table.setFilterValues("topic", values)}
            options={state.topicOptions}
          />
          <FilterSelect
            label={t("fields.priority")}
            value={table.getFilterValues("priority")}
            onValueChange={(values) => table.setFilterValues("priority", values)}
            options={REMINDER_PRIORITIES.map((p) => ({ value: p, label: t(`priorities.${p}`) }))}
          />
          <FilterSelect
            label={t("fields.recurrence")}
            value={table.getFilterValues("recurrence")}
            onValueChange={(values) => table.setFilterValues("recurrence", values)}
            options={REMINDER_RECURRENCES.map((r) => ({ value: r, label: t(`recurrences.${r}`) }))}
          />
          <FilterSelect
            label={t("fields.isCompleted")}
            value={table.getFilterValues("isCompleted")}
            onValueChange={(values) => table.setFilterValues("isCompleted", values.slice(-1))}
            options={[
              { value: "false", label: t("pending") },
              { value: "true", label: t("completed") },
            ]}
          />
          {state.canFilterOwner ? (
            <FilterSelect
              label={tCommon("owner")}
              value={table.getFilterValues("owner")}
              onValueChange={(values) => table.setFilterValues("owner", values.slice(-1))}
              options={state.ownerOptions}
            />
          ) : null}
        </>
      }
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: tCommon("noData") }}
      onReload={() => query.refetch()}
      pagination={
        query.data
          ? {
              value: query.data.pagination,
              onPageChange: table.onPageChange,
              onPageSizeChange: table.onPageSizeChange,
            }
          : undefined
      }
      onView={state.view}
      onEdit={state.edit}
      onDelete={state.remove}
      can={{ update: canUpdate, delete: canDelete }}
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      bulkStatus={
        canUpdate
          ? createBooleanBulkStatus(
              { on: t("completed"), off: t("pending") },
              state.bulkSetCompleted,
            )
          : undefined
      }
      aria-label={t("title")}
    />
  );
}
