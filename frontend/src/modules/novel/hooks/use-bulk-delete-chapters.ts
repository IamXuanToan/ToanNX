/**
 * Mutation xóa hàng loạt chương truyện.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { chapterService } from "../services/chapter.service";

const INVALIDATE = [novelKeys.chapter.all, novelKeys.novel.all];

/**
 * Hook mutation xóa hàng loạt chương truyện.
 *
 * @returns Mutation xóa nhiều chương.
 */
export function useBulkDeleteChapters() {
  return useResourceMutation({
    mutationFn: (ids: string[]) => chapterService.bulkDelete(ids),
    invalidate: INVALIDATE,
    success: "bulkDeleted",
  });
}
