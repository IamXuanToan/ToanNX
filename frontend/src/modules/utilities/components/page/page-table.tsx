"use client";

import type { ComponentProps } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";
import { FilterSelect } from "@/shares/components/common/filter-select";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { Badge } from "@/shares/components/ui/badge";
import { Button } from "@/shares/components/ui/button";

import { UTILITIES_ROUTES } from "../../constants/routes";
import { PAGE_STATUSES, PAGE_TYPES, type Page } from "../../types/page.types";
import { usePageTable } from "./hooks/use-page-table";

const STATUS_TONE = { DRAFT: "neutral", PUBLISHED: "success", UNPUBLISHED: "warning" } as const;

type DetailRouteFn = (id: string) => { pathname: string; params: Record<string, string> };

/**
 * Bảng trang: tiêu đề + URL công khai, loại trang (Affiliate, Bio, Donation, Legacy...),
 * đường dẫn giữa, trạng thái, chủ sở hữu, cập nhật; Sửa, Sao chép (nhân bản), Xóa, Xem.
 * Hỗ trợ truyền detailRoute và ownerId cho Client Portal.
 *
 * @param props - Quyền tạo/sửa/xóa, cờ hiện chủ sở hữu và các tùy biến điều hướng.
 * @returns Bảng.
 */
export function PageTable({
  canCreate,
  canUpdate,
  canDelete,
  showOwner,
  ownerOnly,
  ownerId,
  detailRoute,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  showOwner: boolean;
  ownerOnly?: boolean;
  ownerId?: string;
  detailRoute?: DetailRouteFn;
}) {
  const t = useTranslations("utilities.customPages.pages");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const state = usePageTable({ ownerOnly, ownerId, detailRoute });
  const { table, query } = state;

  const getTargetHref = (id: string): ComponentProps<typeof Link>["href"] =>
    (detailRoute ? detailRoute(id) : UTILITIES_ROUTES.pageDetail(id)) as ComponentProps<
      typeof Link
    >["href"];

  const columns: DataTableColumn<Page>[] = [
    {
      id: "title",
      header: t("columns.title"),
      sortKey: "title",
      mobile: "title",
      className: "md:w-full",
      cell: (page) => (
        <div className="min-w-0">
          <Link
            href={getTargetHref(page.id)}
            className="hover:text-primary block truncate font-medium underline-offset-4 hover:underline"
          >
            {page.title}
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground inline-flex h-auto max-w-full items-center gap-1 truncate p-0 text-xs hover:bg-transparent"
            onClick={() => {
              void navigator.clipboard.writeText(page.publicUrl);
              toast.success(t("copied"));
            }}
            aria-label={t("copy", { url: page.publicUrl })}
          >
            <span className="truncate">{page.publicUrl.replace(/^https?:\/\//, "")}</span>
            <Copy aria-hidden className="size-3 shrink-0" />
          </Button>
        </div>
      ),
    },
    {
      id: "pageType",
      header: t("columns.pageType"),
      hideBelow: "lg",
      cell: (page) => (
        <Badge variant="outline" className="text-xs font-normal">
          {t(`pageTypes.${page.pageType}`)}
        </Badge>
      ),
    },
    { id: "path", header: t("columns.path"), cell: (page) => <span>/{page.path.segment}</span> },
    {
      id: "status",
      header: t("columns.status"),
      sortKey: "status",
      cell: (page) => (
        <StatusBadge tone={STATUS_TONE[page.status]}>{t(`statuses.${page.status}`)}</StatusBadge>
      ),
    },
    ...(showOwner
      ? [
          {
            id: "owner",
            header: t("columns.owner"),
            hideBelow: "xl" as const,
            cell: (page: Page) => (
              <span className="text-muted-foreground truncate">
                {page.owner.fullName || page.owner.email}
              </span>
            ),
          },
        ]
      : []),
    {
      id: "updatedAt",
      header: t("columns.updatedAt"),
      sortKey: "updated_at",
      hideBelow: "lg",
      cell: (page) => (
        <span className="text-muted-foreground">
          {format.relativeTime(new Date(page.updatedAt), now)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="custom-pages"
      columns={columns}
      rows={query.data?.items}
      getRowId={(page) => page.id}
      getRowLabel={(page) => page.title}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      onClearFilters={table.hasFilters ? table.clearFilters : undefined}
      filters={
        <>
          <FilterSelect
            label={t("columns.pageType")}
            value={table.getFilterValues("pageType")}
            onValueChange={(values) => table.setFilterValues("pageType", values)}
            options={PAGE_TYPES.map((type) => ({
              value: type,
              label: t(`pageTypes.${type}`),
            }))}
          />
          <FilterSelect
            label={t("columns.path")}
            value={table.getFilterValues("path")}
            onValueChange={(values) => table.setFilterValues("path", values)}
            options={(state.paths.data ?? []).map((path) => ({
              value: path.id,
              label: `/${path.segment}`,
            }))}
          />
          <FilterSelect
            label={t("columns.status")}
            value={table.getFilterValues("status")}
            onValueChange={(values) => table.setFilterValues("status", values)}
            options={PAGE_STATUSES.map((status) => ({
              value: status,
              label: t(`statuses.${status}`),
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
      onView={state.view}
      onEdit={state.edit}
      onCopy={(page) => void state.duplicate(page)}
      onDelete={state.remove}
      can={{ update: canUpdate, create: canCreate, delete: canDelete }}
      rowActions={[
        {
          key: "view",
          label: t("view"),
          icon: ExternalLink,
          onClick: (page) => window.open(page.publicUrl, "_blank", "noopener,noreferrer"),
        },
      ]}
      bulkStatus={
        canUpdate
          ? {
              options: PAGE_STATUSES.map((status) => ({
                value: status,
                label: t(`statuses.${status}`),
              })),
              onChange: (pages, value) => state.bulkSetStatus(pages, value as Page["status"]),
            }
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
