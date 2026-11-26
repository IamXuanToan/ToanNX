"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge, type StatusTone } from "@/shares/components/common/status-badge";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";

import { CLAIM_STATUSES, CLAIM_TYPES } from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type {
  AssetWarrantyClaim,
  WarrantyClaimStatus,
} from "../../types/asset-warranty-claim.types";
import { useWarrantyClaimTable } from "./hooks/use-warranty-claim-table";

const STATUS_TONE: Record<WarrantyClaimStatus, StatusTone> = {
  SUBMITTED: "info",
  INSPECTING: "info",
  WAITING_PARTS: "warning",
  COMPLETED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
};

/** @param props - Quyền sửa/xóa. @returns Bảng Phiếu bảo hành / sửa chữa thiết bị. */
export function WarrantyClaimTable({
  canUpdate,
  canDelete,
}: {
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const t = useTranslations("workspace.warrantyClaims");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();
  const state = useWarrantyClaimTable();
  const { table, query } = state;

  const columns: DataTableColumn<AssetWarrantyClaim>[] = [
    {
      id: "claimCode",
      header: t("fields.claimCode"),
      mobile: "title",
      className: "md:w-full",
      cell: (item) => (
        <div className="min-w-0">
          <Link
            href={WORKSPACE_ROUTES.warrantyClaimDetail(item.id)}
            className="hover:text-primary font-medium underline-offset-4 hover:underline"
          >
            {item.claimCode || item.issueDescription}
          </Link>
          <p className="text-muted-foreground truncate text-xs">
            <Link href={WORKSPACE_ROUTES.assetDetail(item.assetId)} className="hover:underline">
              {item.assetName}
            </Link>
          </p>
        </div>
      ),
    },
    {
      id: "claimType",
      header: t("fields.claimType"),
      cell: (item) => t(`types.${item.claimType}`),
    },
    {
      id: "status",
      header: t("fields.status"),
      cell: (item) => (
        <StatusBadge tone={STATUS_TONE[item.status]}>{t(`statuses.${item.status}`)}</StatusBadge>
      ),
    },
    {
      id: "submittedDate",
      header: t("fields.submittedDate"),
      sortKey: "submitted_date",
      cell: (item) => format.dateTime(new Date(item.submittedDate), { dateStyle: "short" }),
    },
    {
      id: "costVnd",
      header: t("fields.costVnd"),
      sortKey: "cost_vnd",
      align: "end",
      cell: (item) => (
        <span className="tabular-nums">
          {formatDisplayMoney(item.costVnd, { currency: DEFAULT_CURRENCY })}
        </span>
      ),
    },
    {
      id: "serviceCenter",
      header: t("fields.serviceCenter"),
      hideBelow: "lg",
      cell: (item) => item.serviceCenter || "—",
    },
    ...(state.canManageAll
      ? [
          {
            id: "owner",
            header: tCommon("owner"),
            hideBelow: "xl" as const,
            cell: (item: AssetWarrantyClaim) => (
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
      tableId="workspace-warranty-claims"
      columns={columns}
      rows={query.data?.items}
      getRowId={(item) => item.id}
      getRowLabel={(item) => item.claimCode || item.assetName}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("fields.assetId")}
            value={table.getFilterValues("asset")}
            onValueChange={(values) => table.setFilterValues("asset", values.slice(-1))}
            options={state.assetOptions}
          />
          <FilterSelect
            label={t("fields.claimType")}
            value={table.getFilterValues("claimType")}
            onValueChange={(values) => table.setFilterValues("claimType", values)}
            options={CLAIM_TYPES.map((type) => ({ value: type, label: t(`types.${type}`) }))}
          />
          <FilterSelect
            label={t("fields.status")}
            value={table.getFilterValues("status")}
            onValueChange={(values) => table.setFilterValues("status", values)}
            options={CLAIM_STATUSES.map((s) => ({ value: s, label: t(`statuses.${s}`) }))}
          />
          <FilterSelect
            label={t("fields.isCoveredByWarranty")}
            value={table.getFilterValues("isCoveredByWarranty")}
            onValueChange={(values) =>
              table.setFilterValues("isCoveredByWarranty", values.slice(-1))
            }
            options={[
              { value: "true", label: t("coveredYes") },
              { value: "false", label: t("coveredNo") },
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
      aria-label={t("title")}
    />
  );
}
