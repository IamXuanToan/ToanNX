/**
 * Bảng quản trị danh sách thẻ phân loại (`TagTable`).
 */

"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table/types";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { Tag } from "../../types/tag.types";
import { useTagTable } from "./hooks/use-tag-table";

/**
 * Bảng danh mục thẻ truyện.
 *
 * @param props - Quyền sửa, quyền xóa.
 * @returns DataTable thẻ.
 */
export function TagTable({
  canUpdate = false,
  canDelete = false,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("novel.tags");
  const state = useTagTable();
  const { table, query } = state;

  const columns: DataTableColumn<Tag>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      cell: (tag) => (
        <div>
          {canUpdate ? (
            <Link
              href={NOVEL_ROUTES.adminTagDetail(tag.id)}
              className="block truncate font-medium hover:underline"
            >
              #{tag.name}
            </Link>
          ) : (
            <span className="block truncate font-medium">#{tag.name}</span>
          )}
          <span className="text-muted-foreground block truncate font-mono text-xs">
            /{tag.slug}
          </span>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      tableId="novel-tags"
      columns={columns}
      rows={query.data?.items}
      getRowId={(tag) => tag.id}
      getRowLabel={(tag) => tag.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: t("noTags") }}
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
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
