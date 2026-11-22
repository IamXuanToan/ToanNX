/**
 * Mutation tạo mới chương truyện.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { chapterService } from "../services/chapter.service";
import type { ChapterCreateInput } from "../types/novel.types";

const INVALIDATE = [novelKeys.chapter.all, novelKeys.novel.all];

/**
 * Hook mutation tạo mới chương truyện.
 *
 * @returns Mutation tạo chương.
 */
export function useCreateChapter() {
  return useResourceMutation({
    mutationFn: (input: ChapterCreateInput) => chapterService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
