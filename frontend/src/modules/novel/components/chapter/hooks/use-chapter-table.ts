/**
 * Hook quản lý trạng thái bảng chương truyện.
 */

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";
import { withEditMode } from "@/shares/lib/edit-mode";

import { useBulkActions } from "@/shares/hooks/use-bulk-actions";
import { novelKeys } from "../../../constants/query-keys";
import { chapterService } from "../../../services/chapter.service";
import { NOVEL_ROUTES } from "../../../constants/routes";
import { useChapters } from "../../../hooks/use-chapters";
import { useDeleteChapter } from "../../../hooks/use-delete-chapter";
import type { ChapterListItem } from "../../../types/chapter.types";

/**
 * Quản lý bảng chương truyện.
 *
 * @param novelId - Tùy chọn lọc theo novelId cụ thể.
 * @returns State bảng, query danh sách chương và các action.
 */
export function useChapterTable({ novelId }: { novelId?: string } = {}) {
  const router = useRouter();
  const table = useTableState({ ordering: "chapter_number" });
  const query = useChapters({
    ...table.filters,
    ...(novelId ? { novel: novelId } : {}),
  });
  const remove = useDeleteChapter();

  const bulk = useBulkActions<ChapterListItem>({
    service: chapterService,
    invalidate: [novelKeys.chapter.all, novelKeys.novel.all],
  });
  return {
    bulkDelete: bulk.bulkDelete,
    bulkSetPublished: (rows: ChapterListItem[], value: boolean) =>
      bulk.bulkUpdate(rows, { isPublished: value }),
    table,
    query,
    view: (chapter: ChapterListItem) => router.push(NOVEL_ROUTES.adminChapterDetail(chapter.id)),
    edit: (chapter: ChapterListItem) =>
      router.push(withEditMode(NOVEL_ROUTES.adminChapterDetail(chapter.id))),
    remove: (chapter: ChapterListItem) => remove.mutateAsync(chapter.id),
  };
}
