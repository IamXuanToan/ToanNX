"use client";

import { RotateCcw } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";

import type { NotificationDelivery } from "../types/notification.types";
import { useNotificationDeliveryTable } from "./hooks/use-notification-delivery-table";

const STATUS_TONE = {
  PENDING: "info",
  SENT: "success",
  FAILED: "danger",
  SKIPPED: "neutral",
} as const;
const STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const;
const CHANNELS = ["PUSH", "EMAIL", "TELEGRAM"] as const;

/** @param props - Quyền gửi lại. @returns Bảng nhật ký gửi thông báo. */
export function NotificationDeliveryTable({
  canRetry,
  canDelete,
}: {
  canRetry: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("system.notifications.deliveries");
  const format = useFormatter();
  const state = useNotificationDeliveryTable();
  const { table, query } = state;
  const columns: DataTableColumn<NotificationDelivery>[] = [
    {
      id: "createdAt",
      header: t("columns.createdAt"),
      sortKey: "created_at",
      mobile: "title",
      cell: (row) =>
        format.dateTime(new Date(row.createdAt), { dateStyle: "short", timeStyle: "short" }),
    },
    {
      id: "title",
      header: t("columns.title"),
      className: "md:w-full",
      cell: (row) => <span className="block max-w-96 truncate">{row.title}</span>,
    },
    {
      id: "recipient",
      header: t("columns.recipient"),
      hideBelow: "lg",
      cell: (row) => row.recipientName,
    },
    { id: "channel", header: t("columns.channel"), cell: (row) => t(`channel.${row.channel}`) },
    {
      id: "status",
      header: t("columns.status"),
      cell: (row) => (
        <span className="flex flex-col gap-0.5">
          <StatusBadge tone={STATUS_TONE[row.status]}>{t(`status.${row.status}`)}</StatusBadge>
          {row.lastErrorCode ? (
            <span className="text-muted-foreground text-xs">{row.lastErrorCode}</span>
          ) : null}
        </span>
      ),
    },
    { id: "attempts", header: t("columns.attempts"), align: "end", cell: (row) => row.attempts },
  ];
  return (
    <DataTable
      tableId="notification-deliveries"
      columns={columns}
      rows={query.data?.items}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.title}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("columns.status")}
            value={table.getFilterValues("status")}
            onValueChange={(values) => table.setFilterValues("status", values)}
            options={STATUSES.map((status) => ({ value: status, label: t(`status.${status}`) }))}
          />
          <FilterSelect
            label={t("columns.channel")}
            value={table.getFilterValues("channel")}
            onValueChange={(values) => table.setFilterValues("channel", values)}
            options={CHANNELS.map((channel) => ({
              value: channel,
              label: t(`channel.${channel}`),
            }))}
          />
        </>
      }
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
      rowActions={
        canRetry
          ? [
              {
                key: "retry",
                label: t("retry"),
                icon: RotateCcw,
                onClick: state.retry,
                hidden: (row) => row.status === "SENT" || row.status === "PENDING",
              },
            ]
          : undefined
      }
      aria-label={t("title")}
    />
  );
}
