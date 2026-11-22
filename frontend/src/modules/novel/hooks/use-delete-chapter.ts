/**
 * Mutation xóa một chương truyện.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { chapterService } from "../services/chapter.service";

const INVALIDATE = [novelKeys.chapter.all, novelKeys.novel.all];

/**
 * Hook mutation xóa chương truyện.
 *
 * @returns Mutation xóa chương.
 */
export function useDeleteChapter() {
  return useResourceMutation({
    mutationFn: (id: string) => chapterService.delete(id),
    invalidate: INVALIDATE,
    success: "deleted",
  });
}
