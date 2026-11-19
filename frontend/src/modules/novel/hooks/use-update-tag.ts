/**
 * Mutation cập nhật thẻ phân loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { tagService } from "../services/tag.service";
import type { TagUpdateInput } from "../types/tag.types";

const INVALIDATE = [novelKeys.tag.all, novelKeys.novel.all];

/**
 * Hook mutation cập nhật thông tin thẻ.
 *
 * @param id - UUID thẻ.
 * @returns Mutation cập nhật thẻ.
 */
export function useUpdateTag(id: string) {
  return useResourceMutation({
    mutationFn: (input: TagUpdateInput) => tagService.update(id, input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
