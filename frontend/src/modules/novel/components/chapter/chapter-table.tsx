/**
 * Bảng quản trị danh sách chương truyện (`ChapterTable`).
 */

"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { DataTable } from "@/shares/components/common/data-table";
import type { DataTableColumn } from "@/shares/components/common/data-table.types";

import { createBooleanBulkStatus } from "@/shares/lib/bulk-status";
import { NOVEL_ROUTES } from "../../constants/routes";
import type { ChapterListItem } from "../../types/chapter.types";
import { useChapterTable } from "./hooks/use-chapter-table";

/**
 * Bảng danh sách chương truyện.
 *
 * @param props - novelId để lọc, quyền sửa, quyền xóa.
 * @returns DataTable chương.
 */
export function ChapterTable({
  novelId,
  canUpdate = false,
  canDelete = false,
}: {
  novelId?: string;
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("novel.chapters");
  const tPublish = useTranslations("novel.novelForm.fields");
  const state = useChapterTable({ novelId });
  const { table, query } = state;

  const columns: DataTableColumn<ChapterListItem>[] = [
    {
      id: "chapterNumber",
      header: "#",
      sortKey: "chapter_number",
      cell: (chapter) => <span className="font-mono font-medium">#{chapter.chapterNumber}</span>,
    },
    {
      id: "title",
      header: t("fields.title"),
      sortKey: "title",
      mobile: "title",
      className: "md:w-1/2",
      cell: (chapter) => (
        <div>
          {canUpdate ? (
            <Link
              href={NOVEL_ROUTES.adminChapterDetail(chapter.id)}
              className="block truncate font-medium hover:underline"
            >
              {chapter.title}
            </Link>
          ) : (
            <span className="block truncate font-medium">{chapter.title}</span>
          )}
          <span className="text-muted-foreground block truncate font-mono text-xs">
            /{chapter.slug}
          </span>
        </div>
      ),
    },
    {
      id: "wordCount",
      header: t("fields.wordCount"),
      cell: (chapter) => (
        <span className="text-muted-foreground font-mono text-xs">
          {chapter.wordCount?.toLocaleString() ?? 0}
        </span>
      ),
    },
    {
      id: "viewsCount",
      header: t("fields.viewsCount"),
      cell: (chapter) => (
        <span className="text-muted-foreground font-mono text-xs">
          {chapter.viewsCount?.toLocaleString() ?? 0}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      tableId="novel-chapters"
      columns={columns}
      rows={query.data?.items}
      getRowId={(chapter) => chapter.id}
      getRowLabel={(chapter) => chapter.title}
      search={{ ...table.search, placeholder: t("searchPlaceholder") }}
      ordering={table.ordering}
      onOrderingChange={table.onOrderingChange}
      isLoading={query.isPending}
      isFetching={query.isFetching && !query.isPending}
      error={query.isError ? { onRetry: () => query.refetch() } : null}
      empty={{ title: t("noChapters") }}
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
              { on: tPublish("published"), off: tPublish("draft") },
              state.bulkSetPublished,
            )
          : undefined
      }
      onBulkDelete={canDelete ? state.bulkDelete : undefined}
      aria-label={t("title")}
    />
  );
}
