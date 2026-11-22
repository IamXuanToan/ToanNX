"use client";

import Image from "next/image";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { Badge } from "@/shares/components/ui/badge";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { QR_TYPES, type QrCode } from "../../types/qr-code.types";
import { useQrCodeTable } from "./hooks/use-qr-code-table";

/**
 * Bảng mã QR: ảnh nhỏ + tên, loại, chủ sở hữu (khi xem được của mọi người), cập nhật; Sửa, Xóa, xóa hàng loạt.
 *
 * @param props - Quyền sửa/xóa và có hiện cột chủ sở hữu.
 * @returns Bảng.
 */
export function QrCodeTable({
  canUpdate,
  canDelete,
  showOwner,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  showOwner: boolean;
}) {
  const t = useTranslations("utilities.qrCodes");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const state = useQrCodeTable();
  const { table, query } = state;

  const columns: DataTableColumn<QrCode>[] = [
    {
      id: "name",
      header: t("columns.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (code) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border bg-white">
            <Image
              src={code.image.url}
              alt={code.name}
              fill
              sizes="40px"
              className="object-contain p-0.5"
            />
          </div>
          <Link
            href={UTILITIES_ROUTES.qrCodeDetail(code.id)}
            className="hover:text-primary truncate font-medium underline-offset-4 hover:underline"
          >
            {code.name}
          </Link>
        </div>
      ),
    },
    {
      id: "qrType",
      header: t("columns.qrType"),
      sortKey: "qr_type",
      cell: (code) => <Badge variant="secondary">{t(`types.${code.qrType}`)}</Badge>,
    },
    ...(showOwner
      ? [
          {
            id: "owner",
            header: t("columns.owner"),
            hideBelow: "lg" as const,
            cell: (code: QrCode) => (
              <span className="text-muted-foreground truncate">
                {code.owner.fullName || code.owner.email}
              </span>
            ),
          },
        ]
      : []),
    {
      id: "updatedAt",
      header: t("columns.updatedAt"),
      sortKey: "updated_at",
      cell: (code) => (
        <span className="text-muted-foreground">
          {format.relativeTime(new Date(code.updatedAt), now)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="qr-codes"
      columns={columns}
      rows={query.data?.items}
      getRowId={(code) => code.id}
      getRowLabel={(code) => code.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <FilterSelect
          label={t("columns.qrType")}
          value={table.getFilterValues("qrType")}
          onValueChange={(values) => table.setFilterValues("qrType", values)}
          options={QR_TYPES.map((value) => ({ value, label: t(`types.${value}`) }))}
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
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
