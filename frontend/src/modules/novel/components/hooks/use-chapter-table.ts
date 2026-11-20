/**
 * Hook quản lý trạng thái bảng chương truyện.
 */

import { useRouter } from "@/i18n/navigation";
import { useTableState } from "@/shares/hooks/use-table-state";

import { NOVEL_ROUTES } from "../../constants/routes";
import { useBulkDeleteChapters } from "../../hooks/use-bulk-delete-chapters";
import { useChapters } from "../../hooks/use-chapters";
import { useDeleteChapter } from "../../hooks/use-delete-chapter";
import type { ChapterListItem } from "../../types/chapter.types";

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
  const bulkDelete = useBulkDeleteChapters();

  return {
    table,
    query,
    edit: (chapter: ChapterListItem) => router.push(NOVEL_ROUTES.adminChapterDetail(chapter.id)),
    remove: (chapter: ChapterListItem) => remove.mutateAsync(chapter.id),
    bulkDelete: (chapters: ChapterListItem[]) => bulkDelete.mutateAsync(chapters.map((c) => c.id)),
  };
}
