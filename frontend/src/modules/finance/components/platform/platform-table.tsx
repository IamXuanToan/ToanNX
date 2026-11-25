"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { Button } from "@/shares/components/ui/button";

import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { useFinanceRoutes } from "../../hooks/use-finance-routes";
import type { Platform } from "../../types/platform.types";
import { usePlatformTable } from "./hooks/use-platform-table";

/**
 * Bảng nền tảng: tên, mã, tiền tệ mặc định, khấu trừ hiện tại (cảnh báo khi chưa cấu hình), trạng thái.
 *
 * @param props - Quyền tạo/sửa/xóa.
 * @returns Bảng.
 */
export function PlatformTable({
  canCreate,
  canUpdate,
  canDelete,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("finance.platforms");
  const tStatus = useTranslations("common.status");
  const routes = useFinanceRoutes();
  const state = usePlatformTable();
  const { table, query } = state;
  const columns: DataTableColumn<Platform>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (platform) => (
        <Link
          href={routes.platformDetail(platform.id)}
          className="hover:text-primary font-medium underline-offset-4 hover:underline"
        >
          {platform.name}
        </Link>
      ),
    },
    {
      id: "code",
      header: t("fields.code"),
      cell: (platform) => <code className="text-xs">{platform.code}</code>,
    },
    {
      id: "currency",
      header: t("fields.defaultCurrency"),
      cell: (platform) => platform.defaultCurrencyCode,
    },
    {
      id: "tax",
      header: t("fields.currentTax"),
      cell: (platform) =>
        platform.currentTax ? (
          <StatusBadge tone={platform.currentTax.taxWithheld ? "success" : "neutral"}>
            {platform.currentTax.taxWithheld
              ? t("withheld", { rate: Number(platform.currentTax.rate) })
              : t("notWithheld")}
          </StatusBadge>
        ) : (
          <StatusBadge tone="warning">{t("noRate")}</StatusBadge>
        ),
    },
    {
      id: "status",
      header: t("fields.isActive"),
      cell: (platform) => (
        <StatusBadge tone={platform.isActive ? "success" : "neutral"}>
          {platform.isActive ? tStatus("active") : tStatus("inactive")}
        </StatusBadge>
      ),
    },
  ];
  return (
    <DataTable
      tableId="finance-platforms"
      columns={columns}
      rows={query.data?.items}
      getRowId={(platform) => platform.id}
      getRowLabel={(platform) => platform.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <FilterSelect
          label={t("fields.isActive")}
          value={table.getFilterValues("isActive")}
          onValueChange={(values) => table.setFilterValues("isActive", values)}
          options={[
            { value: "true", label: tStatus("active") },
            { value: "false", label: tStatus("inactive") },
          ]}
        />
      }
      toolbar={
        canCreate ? (
          <Button type="button" variant="outline" onClick={state.seed} disabled={state.isSeeding}>
            <Sparkles />
            {t("seed")}
          </Button>
        ) : null
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
