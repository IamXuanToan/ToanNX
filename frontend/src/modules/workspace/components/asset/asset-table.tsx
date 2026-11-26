"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge, type StatusTone } from "@/shares/components/common/status-badge";
import { DEFAULT_CURRENCY } from "@/shares/constants/currency";
import { formatDisplayMoney } from "@/shares/lib/number-format";

import {
  ASSET_CATEGORIES,
  ASSET_PURCHASE_CHANNELS,
  ASSET_STATUSES,
  ASSET_WARRANTY_TYPES,
} from "../../constants/defaults";
import { WORKSPACE_ROUTES } from "../../constants/routes";
import type { Asset, AssetStatus } from "../../types/asset.types";
import { useAssetTable } from "./hooks/use-asset-table";

const STATUS_TONE: Record<AssetStatus, StatusTone> = {
  IN_USE: "success",
  BACKUP: "neutral",
  IN_WARRANTY: "info",
  IN_REPAIR: "warning",
  SOLD: "neutral",
  BROKEN: "danger",
};

/** @param props - Quyền sửa/xóa. @returns Bảng Thiết bị & Tài sản cá nhân. */
export function AssetTable({ canUpdate, canDelete }: { canUpdate: boolean; canDelete: boolean }) {
  const t = useTranslations("workspace.assets");
  const tCommon = useTranslations("workspace.common");
  const format = useFormatter();
  const state = useAssetTable();
  const { table, query } = state;

  const columns: DataTableColumn<Asset>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (item) => (
        <div className="min-w-0">
          <Link
            href={WORKSPACE_ROUTES.assetDetail(item.id)}
            className="hover:text-primary font-medium underline-offset-4 hover:underline"
          >
            {item.name}
          </Link>
          {item.brand || item.modelCode ? (
            <p className="text-muted-foreground truncate text-xs">
              {[item.brand, item.modelCode].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "category",
      header: t("fields.category"),
      cell: (item) => t(`categories.${item.category}`),
    },
    {
      id: "status",
      header: t("fields.status"),
      cell: (item) => (
        <StatusBadge tone={STATUS_TONE[item.status]}>{t(`statuses.${item.status}`)}</StatusBadge>
      ),
    },
    {
      id: "purchasePriceVnd",
      header: t("fields.purchasePriceVnd"),
      sortKey: "purchase_price_vnd",
      align: "end",
      cell: (item) => (
        <span className="tabular-nums">
          {formatDisplayMoney(item.purchasePriceVnd, { currency: DEFAULT_CURRENCY })}
        </span>
      ),
    },
    {
      id: "warrantyEndDate",
      header: t("fields.warrantyEndDate"),
      sortKey: "warranty_end_date",
      hideBelow: "lg",
      cell: (item) =>
        item.warrantyEndDate
          ? format.dateTime(new Date(item.warrantyEndDate), { dateStyle: "short" })
          : "—",
    },
    {
      id: "claims",
      header: t("fields.warrantyClaimCount"),
      align: "end",
      hideBelow: "lg",
      cell: (item) => (
        <Link
          href={
            {
              ...WORKSPACE_ROUTES.assetDetail(item.id),
              query: { tab: "claims" },
            } as never
          }
          className="text-primary font-medium tabular-nums underline-offset-4 hover:underline"
        >
          {item.totalClaimCount} ({item.openClaimCount})
        </Link>
      ),
    },
    ...(state.canManageAll
      ? [
          {
            id: "owner",
            header: tCommon("owner"),
            hideBelow: "xl" as const,
            cell: (item: Asset) => (
              <span className="text-muted-foreground block max-w-44 truncate">
                {item.ownerName || item.ownerEmail}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      tableId="workspace-assets"
      columns={columns}
      rows={query.data?.items}
      getRowId={(item) => item.id}
      getRowLabel={(item) => item.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("fields.category")}
            value={table.getFilterValues("category")}
            onValueChange={(values) => table.setFilterValues("category", values)}
            options={ASSET_CATEGORIES.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
          />
          <FilterSelect
            label={t("fields.status")}
            value={table.getFilterValues("status")}
            onValueChange={(values) => table.setFilterValues("status", values)}
            options={ASSET_STATUSES.map((s) => ({ value: s, label: t(`statuses.${s}`) }))}
          />
          <FilterSelect
            label={t("fields.warrantyType")}
            value={table.getFilterValues("warrantyType")}
            onValueChange={(values) => table.setFilterValues("warrantyType", values)}
            options={ASSET_WARRANTY_TYPES.map((w) => ({
              value: w,
              label: t(`warrantyTypes.${w}`),
            }))}
          />
          <FilterSelect
            label={t("fields.purchaseChannel")}
            value={table.getFilterValues("purchaseChannel")}
            onValueChange={(values) => table.setFilterValues("purchaseChannel", values)}
            options={ASSET_PURCHASE_CHANNELS.map((ch) => ({
              value: ch,
              label: t(`channels.${ch}`),
            }))}
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
