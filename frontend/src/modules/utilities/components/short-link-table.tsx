"use client";

import { Copy } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { TableStatusSwitch } from "@/shares/components/common/table-status-switch";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import { UTILITIES_ROUTES } from "../constants/routes";
import type { ShortLink } from "../types/short-link.types";
import { useShortLinkTable } from "./hooks/use-short-link-table";

/**
 * Bảng link rút gọn: tên + URL ngắn (sao chép), URL đích, cách mở, hạn, trạng thái (công tắc),
 * cột Chủ sở hữu khi xem được của mọi người; thao tác Sửa, Xóa, hàng loạt bật/tắt và xóa.
 *
 * @param props - Quyền sửa/xóa và có hiện cột chủ sở hữu.
 * @returns Bảng.
 */
export function ShortLinkTable({
  canUpdate,
  canDelete,
  showOwner,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  showOwner: boolean;
}) {
  const t = useTranslations("utilities.shortLinks");
  const tStatus = useTranslations("common.status");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const state = useShortLinkTable();
  const { table, query } = state;

  const columns: DataTableColumn<ShortLink>[] = [
    {
      id: "name",
      header: t("columns.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-full",
      cell: (link) => (
        <div className="min-w-0">
          <Link
            href={UTILITIES_ROUTES.shortLinkDetail(link.id)}
            className="hover:text-primary block truncate font-medium underline-offset-4 hover:underline"
          >
            {link.name}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground inline-flex h-auto max-w-full items-center gap-1 truncate p-0 text-xs hover:bg-transparent"
            onClick={() => {
              void navigator.clipboard.writeText(link.shortUrl);
              toast.success(t("copied"));
            }}
            aria-label={t("copy", { url: link.shortUrl })}
          >
            <span className="truncate">{link.shortUrl}</span>
            <Copy aria-hidden className="size-3 shrink-0" />
          </Button>
        </div>
      ),
    },
    {
      id: "destination",
      header: t("columns.destination"),
      hideBelow: "lg",
      cell: (link) => (
        <span className="text-muted-foreground block max-w-64 truncate" title={link.destinationUrl}>
          {link.destinationUrl}
        </span>
      ),
    },
    {
      id: "access",
      header: t("columns.access"),
      cell: (link) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">
            {link.autoRedirectSeconds === null
              ? t("landing.manual")
              : t("landing.autoSeconds", { seconds: link.autoRedirectSeconds })}
          </Badge>
          {link.hasPassword ? <Badge variant="outline">{t("fields.password")}</Badge> : null}
        </div>
      ),
    },
    {
      id: "expiresAt",
      header: t("columns.expiresAt"),
      sortKey: "expires_at",
      cell: (link) =>
        link.effectiveStatus === "EXPIRED" ? (
          <Badge variant="destructive">{t("expired")}</Badge>
        ) : link.expiresAt ? (
          <span className="text-muted-foreground">
            {format.relativeTime(new Date(link.expiresAt), now)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    ...(showOwner
      ? [
          {
            id: "owner",
            header: t("columns.owner"),
            hideBelow: "xl" as const,
            cell: (link: ShortLink) => (
              <span className="text-muted-foreground truncate">
                {link.owner.fullName || link.owner.email}
              </span>
            ),
          },
        ]
      : []),
    {
      id: "status",
      header: t("columns.status"),
      sortKey: "status",
      cell: (link) => (
        <TableStatusSwitch
          checked={link.status === "ACTIVE"}
          onLabel={tStatus("active")}
          offLabel={t("inactive")}
          aria-label={link.status === "ACTIVE" ? t("actions.disable") : t("actions.enable")}
          onCheckedChange={
            canUpdate
              ? (checked) => state.setStatus(link, checked ? "ACTIVE" : "INACTIVE")
              : undefined
          }
        />
      ),
    },
  ];

  return (
    <DataTable
      tableId="short-links"
      columns={columns}
      rows={query.data?.items}
      getRowId={(link) => link.id}
      getRowLabel={(link) => link.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("columns.status")}
            value={table.getFilterValues("status")}
            onValueChange={(values) => table.setFilterValues("status", values)}
            options={[
              { value: "ACTIVE", label: tStatus("active") },
              { value: "INACTIVE", label: t("inactive") },
              { value: "EXPIRED", label: t("expired") },
            ]}
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
      onEdit={canUpdate ? state.edit : undefined}
      onDelete={canDelete ? state.remove : undefined}
      bulkStatus={
        canUpdate
          ? {
              options: [
                { value: "ACTIVE", label: tStatus("active") },
                { value: "INACTIVE", label: t("inactive") },
              ],
              onChange: (links, value) =>
                state.bulkSetStatus(links, value as "ACTIVE" | "INACTIVE"),
            }
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
