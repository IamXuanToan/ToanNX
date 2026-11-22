"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";

import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { FINANCE_ROUTES } from "../../constants/routes";
import type { ClassificationRule } from "../../types/classification-rule.types";
import { useClassificationRuleTable } from "./hooks/use-classification-rule-table";

/** @param props - Quyền sửa/xóa. @returns Bảng quy tắc nhận diện. */
export function ClassificationRuleTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("finance.rules");
  const tStatus = useTranslations("common.status");
  const state = useClassificationRuleTable();
  const { table, query } = state;
  const columns: DataTableColumn<ClassificationRule>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (rule) => (
        <Link
          href={FINANCE_ROUTES.ruleDetail(rule.id)}
          className="hover:text-primary font-medium underline-offset-4 hover:underline"
        >
          {rule.name}
        </Link>
      ),
    },
    { id: "platform", header: t("fields.platform"), cell: (rule) => rule.platformName },
    {
      id: "pattern",
      header: t("fields.pattern"),
      cell: (rule) => <code className="text-xs">{rule.pattern}</code>,
    },
    {
      id: "priority",
      header: t("fields.priority"),
      sortKey: "priority",
      align: "end",
      cell: (rule) => rule.priority,
    },
    {
      id: "status",
      header: t("fields.isActive"),
      cell: (rule) => (
        <StatusBadge tone={rule.isActive ? "success" : "neutral"}>
          {rule.isActive ? tStatus("active") : tStatus("inactive")}
        </StatusBadge>
      ),
    },
  ];
  return (
    <DataTable
      tableId="finance-rules"
      columns={columns}
      rows={query.data?.items}
      getRowId={(rule) => rule.id}
      getRowLabel={(rule) => rule.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <FilterSelect
          label={t("fields.platform")}
          value={table.getFilterValues("platform")}
          onValueChange={(values) => table.setFilterValues("platform", values)}
          options={state.platformOptions}
        />
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
      onView={state.view}
      onEdit={state.edit}
      onDelete={state.remove}
      can={{ update: canUpdate, delete: canDelete }}
      bulkStatus={
        canUpdate
          ? createBooleanBulkStatus(
              { on: tStatus("active"), off: tStatus("inactive") },
              state.bulkSetActive,
            )
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
