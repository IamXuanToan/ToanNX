/**
 * Mutation cập nhật chương truyện.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { chapterService } from "../services/chapter.service";
import type { ChapterUpdateInput } from "../types/novel.types";

const INVALIDATE = [novelKeys.chapter.all, novelKeys.novel.all];

/**
 * Hook mutation cập nhật thông tin chương truyện.
 *
 * @param id - UUID chương.
 * @returns Mutation cập nhật chương.
 */
export function useUpdateChapter(id: string) {
  return useResourceMutation({
    mutationFn: (input: ChapterUpdateInput) => chapterService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
