/**
 * Mutation cập nhật tiểu thuyết.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";
import type { NovelUpdateInput } from "../types/novel.types";

const INVALIDATE = [novelKeys.novel.all];

/**
 * Hook mutation cập nhật thông tin tiểu thuyết.
 *
 * @param id - UUID tiểu thuyết.
 * @returns Mutation cập nhật tiểu thuyết.
 */
export function useUpdateNovel(id: string) {
  return useResourceMutation({
    mutationFn: (input: NovelUpdateInput) => novelService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
