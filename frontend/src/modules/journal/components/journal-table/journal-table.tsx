"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";

import { DataTable } from "@/shares/components/common/data-table/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table/types";
import { FilterSelect } from "@/shares/components/common/filter-select/filter-select";
import { Badge } from "@/shares/components/ui/badge";

import { JOURNAL_ACTIONS, type JournalEntry } from "../../types/journal.types";
import { useJournalTable } from "./hooks/use-journal-table";

/**
 * Bảng nhật ký toàn hệ thống: thời điểm, người làm, tài nguyên (module.model), bản ghi, hành động, field đổi.
 * Chỉ đọc (không chọn dòng, không thao tác).
 *
 * @returns Bảng nhật ký.
 */
export function JournalTable() {
  const t = useTranslations("journal");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const { table, query, resources, resourceName } = useJournalTable();

  const columns: DataTableColumn<JournalEntry>[] = [
    {
      id: "object",
      header: t("columns.object"),
      mobile: "title",
      className: "md:w-full",
      cell: (entry) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{entry.objectLabel || entry.objectId}</p>
          <p className="text-muted-foreground truncate text-xs">
            {resourceName.get(entry.resource) ?? entry.resource}
          </p>
        </div>
      ),
    },
    {
      id: "action",
      header: t("columns.action"),
      cell: (entry) => (
        <Badge variant={entry.action === "DELETE" ? "destructive" : "secondary"}>
          {entry.action === "EVENT" ? entry.event : t(`actions.${entry.action}`)}
        </Badge>
      ),
    },
    {
      id: "changes",
      header: t("columns.changes"),
      hideBelow: "lg",
      cell: (entry) => {
        const fields = Object.keys(entry.changes);
        return fields.length ? (
          <span className="text-muted-foreground text-xs">{fields.join(", ")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "actor",
      header: t("columns.actor"),
      cell: (entry) =>
        entry.actorLabel || <span className="text-muted-foreground">{t("system")}</span>,
    },
    {
      id: "createdAt",
      header: t("columns.createdAt"),
      sortKey: "created_at",
      cell: (entry) => (
        <time dateTime={entry.createdAt} className="text-muted-foreground whitespace-nowrap">
          {format.relativeTime(new Date(entry.createdAt), now)}
        </time>
      ),
    },
  ];

  return (
    <DataTable
      tableId="journal-entries"
      columns={columns}
      rows={query.data?.items}
      getRowId={(entry) => entry.id}
      getRowLabel={(entry) => entry.objectLabel}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("columns.resource")}
            value={table.getFilterValues("resource")}
            onValueChange={(values) => table.setFilterValues("resource", values)}
            options={(resources.data ?? []).map((item) => ({
              value: item.resource,
              label: `${item.name} (${item.resource})`,
            }))}
          />
          <FilterSelect
            label={t("columns.action")}
            value={table.getFilterValues("action")}
            onValueChange={(values) => table.setFilterValues("action", values)}
            options={JOURNAL_ACTIONS.map((value) => ({ value, label: t(`actions.${value}`) }))}
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
      aria-label={t("title")}
    />
  );
}
