"use client";

import { useTranslations } from "next-intl";

import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { TimestampText } from "@/shares/components/common/timestamp-text";

import type { SystemAnnouncement } from "../../types/notification.types";
import { useAnnouncementTable } from "./hooks/use-announcement-table";

const LEVEL_TONE = { INFO: "info", WARNING: "warning", ERROR: "danger" } as const;

/** @param props - Quyền thu hồi. @returns Bảng thông báo hệ thống đã gửi. */
export function AnnouncementTable({ canDelete }: { canDelete: boolean }) {
  const t = useTranslations("system.notifications.announcements");
  const state = useAnnouncementTable();
  const { table, query } = state;
  const columns: DataTableColumn<SystemAnnouncement>[] = [
    {
      id: "title",
      header: t("fields.title"),
      mobile: "title",
      className: "md:w-full",
      cell: (row) => <span className="font-medium">{row.title}</span>,
    },
    {
      id: "level",
      header: t("fields.level"),
      cell: (row) => (
        <StatusBadge tone={LEVEL_TONE[row.level]}>{t(`level.${row.level}`)}</StatusBadge>
      ),
    },
    { id: "target", header: t("fields.target"), cell: (row) => t(`target.${row.target}`) },
    {
      id: "recipients",
      header: t("fields.recipients"),
      align: "end",
      cell: (row) => row.recipientCount,
    },
    {
      id: "sentAt",
      header: t("fields.sentAt"),
      sortKey: "created_at",
      cell: (row) => <TimestampText value={row.sentAt} />,
    },
  ];
  return (
    <DataTable
      tableId="system-announcements"
      columns={columns}
      rows={query.data?.items}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.title}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: t("empty") }}
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
      onDelete={state.remove}
      can={{ delete: canDelete }}
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
