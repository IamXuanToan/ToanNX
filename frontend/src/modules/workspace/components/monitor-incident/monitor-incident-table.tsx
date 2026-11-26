"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";

import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { MonitorIncident } from "../../types/monitor-incident.types";
import { useMonitorIncidentTable } from "./hooks/use-monitor-incident-table";

/** @param props - Quyền xóa. @returns Bảng Sự cố Uptime. */
export function MonitorIncidentTable({ canDelete }: { canDelete: boolean }) {
  const t = useTranslations("workspace.monitorIncidents");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();
  const state = useMonitorIncidentTable();
  const { table, query } = state;

  const columns: DataTableColumn<MonitorIncident>[] = [
    {
      id: "targetName",
      header: t("fields.targetName"),
      mobile: "title",
      className: "md:w-full",
      cell: (item) => (
        <div className="min-w-0">
          <Link
            href={WORKSPACE_ROUTES.monitorDetail(item.targetId)}
            className="hover:text-primary font-medium underline-offset-4 hover:underline"
          >
            {item.targetName}
          </Link>
          {item.errorMessage ? (
            <p className="text-muted-foreground max-w-sm truncate text-xs">{item.errorMessage}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "startedAt",
      header: t("fields.startedAt"),
      sortKey: "started_at",
      cell: (item) =>
        format.dateTime(new Date(item.startedAt), { dateStyle: "short", timeStyle: "short" }),
    },
    {
      id: "resolvedAt",
      header: t("fields.resolvedAt"),
      cell: (item) => (
        <StatusBadge tone={item.resolvedAt ? "success" : "danger"}>
          {item.resolvedAt ? t("resolved") : t("ongoing")}
        </StatusBadge>
      ),
    },
    {
      id: "statusCode",
      header: t("fields.statusCode"),
      align: "end",
      hideBelow: "lg",
      cell: (item) => item.statusCode ?? "—",
    },
    {
      id: "durationSeconds",
      header: t("fields.durationSeconds"),
      align: "end",
      hideBelow: "lg",
      cell: (item) =>
        item.durationSeconds !== null
          ? t("durationSeconds", { seconds: item.durationSeconds })
          : "—",
    },
    ...(state.canManageAll
      ? [
          {
            id: "owner",
            header: tCommon("owner"),
            hideBelow: "xl" as const,
            cell: (item: MonitorIncident) => (
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
      tableId="workspace-monitor-incidents"
      columns={columns}
      rows={query.data?.items}
      getRowId={(item) => item.id}
      getRowLabel={(item) => `${item.targetName} (${item.startedAt})`}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("fields.targetName")}
            value={table.getFilterValues("target")}
            onValueChange={(values) => table.setFilterValues("target", values.slice(-1))}
            options={state.targetOptions}
          />
          <FilterSelect
            label={t("fields.resolvedAt")}
            value={table.getFilterValues("resolved")}
            onValueChange={(values) => table.setFilterValues("resolved", values.slice(-1))}
            options={[
              { value: "true", label: t("resolved") },
              { value: "false", label: t("ongoing") },
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
      onDelete={state.remove}
      can={{ update: false, delete: canDelete }}
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
