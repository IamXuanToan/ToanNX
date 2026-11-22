/**
 * Bảng quản trị danh sách thể loại (`GenreTable`).
 */

"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { Genre } from "../../types/genre.types";
import { useGenreTable } from "./hooks/use-genre-table";

/**
 * Bảng danh mục thể loại truyện.
 *
 * @param props - Quyền sửa, quyền xóa.
 * @returns DataTable thể loại.
 */
export function GenreTable({
  canUpdate = false,
  canDelete = false,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("novel.genres");
  const state = useGenreTable();
  const { table, query } = state;

  const columns: DataTableColumn<Genre>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-1/3",
      cell: (genre) => (
        <div>
          {canUpdate ? (
            <Link
              href={NOVEL_ROUTES.adminGenreDetail(genre.id)}
              className="block truncate font-medium hover:underline"
            >
              {genre.name}
            </Link>
          ) : (
            <span className="block truncate font-medium">{genre.name}</span>
          )}
          <span className="text-muted-foreground block truncate font-mono text-xs">
            /{genre.slug}
          </span>
        </div>
      ),
    },
    {
      id: "description",
      header: t("fields.description"),
      cell: (genre) => (
        <span className="text-muted-foreground line-clamp-2 text-xs">
          {genre.description || "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="novel-genres"
      columns={columns}
      rows={query.data?.items}
      getRowId={(genre) => genre.id}
      getRowLabel={(genre) => genre.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: t("noGenres") }}
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
