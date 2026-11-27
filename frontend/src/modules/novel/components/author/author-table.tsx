/**
 * Bảng quản trị danh sách tác giả (`AuthorTable`).
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";

import { NOVEL_ROUTES } from "../../constants/routes";
import type { Author } from "../../types/author.types";
import { useAuthorTable } from "./hooks/use-author-table";

/**
 * Bảng danh sách tác giả tiểu thuyết.
 *
 * @param props - Quyền sửa, quyền xóa.
 * @returns DataTable tác giả.
 */
export function AuthorTable({
  canUpdate = false,
  canDelete = false,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("novel.authors");
  const state = useAuthorTable();
  const { table, query } = state;

  const columns: DataTableColumn<Author>[] = [
    {
      id: "name",
      header: t("fields.name"),
      sortKey: "name",
      mobile: "title",
      className: "md:w-1/3",
      cell: (author) => (
        <div className="flex min-w-0 items-center gap-3">
          {author.avatar?.url ? (
            <div className="relative size-10 shrink-0 overflow-hidden rounded-full border">
              <Image
                src={author.avatar.url}
                alt={author.name}
                fill
                sizes="40px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {canUpdate ? (
              <Link
                href={NOVEL_ROUTES.adminAuthorDetail(author.id)}
                className="block truncate font-medium hover:underline"
              >
                {author.name}
              </Link>
            ) : (
              <span className="block truncate font-medium">{author.name}</span>
            )}
            <span className="text-muted-foreground block truncate font-mono text-xs">
              /{author.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "bio",
      header: t("fields.bio"),
      cell: (author) => (
        <span className="text-muted-foreground line-clamp-2 text-xs">{author.bio || "—"}</span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="novel-authors"
      columns={columns}
      rows={query.data?.items}
      getRowId={(author) => author.id}
      getRowLabel={(author) => author.name}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: t("noAuthors") }}
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
