"use client";

import { Activity } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge, type StatusTone } from "@/shares/components/common/status-badge";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { toSafeHttpUrl } from "@/shares/lib/safe-url";

import { MONITOR_METHODS, MONITOR_STATUSES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { MonitorStatus, MonitorTarget } from "../../types/monitor-target.types";
import { useMonitorTargetTable } from "./hooks/use-monitor-target-table";

const STATUS_TONE: Record<MonitorStatus, StatusTone> = {
  HEALTHY: "success",
  DEGRADED: "warning",
  DOWN: "danger",
  UNKNOWN: "neutral",
};

/** @param props - Quyền sửa/xóa. @returns Bảng Endpoint giám sát Uptime. */
export function MonitorTargetTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("workspace.monitors");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();
  const state = useMonitorTargetTable();
  const { table, query } = state;

  const columns: DataTableColumn<MonitorTarget>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (item) => {
        const safeUrl = toSafeHttpUrl(item.url, { allowRelative: false });
        return (
          <div className="min-w-0">
            <Link
              href={WORKSPACE_ROUTES.monitorDetail(item.id)}
              className="hover:text-primary font-medium underline-offset-4 hover:underline"
            >
              {item.name}
            </Link>
            {safeUrl ? (
              <p className="text-muted-foreground max-w-xs truncate text-xs">{safeUrl}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "method",
      header: t("fields.method"),
      cell: (item) => item.method,
    },
    {
      id: "lastStatus",
      header: t("fields.lastStatus"),
      cell: (item) => (
        <StatusBadge tone={STATUS_TONE[item.lastStatus]}>
          {t(`statuses.${item.lastStatus}`)}
        </StatusBadge>
      ),
    },
    {
      id: "lastLatencyMs",
      header: t("fields.lastLatencyMs"),
      align: "end",
      hideBelow: "lg",
      cell: (item) =>
        item.lastLatencyMs !== null ? t("msUnit", { value: item.lastLatencyMs }) : "—",
    },
    {
      id: "lastCheckedAt",
      header: t("fields.lastCheckedAt"),
      hideBelow: "lg",
      cell: (item) =>
        item.lastCheckedAt
          ? format.dateTime(new Date(item.lastCheckedAt), {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "—",
    },
    {
      id: "isActive",
      header: t("fields.isActive"),
      cell: (item) => (
        <TableStatusSwitch
          checked={item.isActive}
          onLabel={tCommon("active")}
          offLabel={tCommon("inactive")}
          aria-label={t("fields.isActive")}
          onCheckedChange={
            canUpdate ? (checked) => void state.toggleActive(item, checked) : undefined
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
            cell: (item: MonitorTarget) => (
              <span className="text-muted-foreground block max-w-44 truncate">
                {item.ownerEmail}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      tableId="workspace-monitors"
      columns={columns}
      rows={query.data?.items}
      getRowId={(item) => item.id}
      getRowLabel={(item) => item.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("fields.lastStatus")}
            value={table.getFilterValues("lastStatus")}
            onValueChange={(values) => table.setFilterValues("lastStatus", values)}
            options={MONITOR_STATUSES.map((s) => ({ value: s, label: t(`statuses.${s}`) }))}
          />
          <FilterSelect
            label={t("fields.method")}
            value={table.getFilterValues("method")}
            onValueChange={(values) => table.setFilterValues("method", values)}
            options={MONITOR_METHODS.map((m) => ({ value: m, label: m }))}
          />
          <FilterSelect
            label={t("fields.isActive")}
            value={table.getFilterValues("isActive")}
            onValueChange={(values) => table.setFilterValues("isActive", values.slice(-1))}
            options={[
              { value: "true", label: tCommon("active") },
              { value: "false", label: tCommon("inactive") },
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
      rowActions={
        canUpdate
          ? [
              {
                key: "ping",
                label: t("pingNow"),
                icon: Activity,
                onClick: (item) => void state.pingNow(item),
              },
            ]
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
              { on: tCommon("active"), off: tCommon("inactive") },
              state.bulkSetActive,
            )
          : undefined
      }
      aria-label={t("title")}
    />
  );
}
