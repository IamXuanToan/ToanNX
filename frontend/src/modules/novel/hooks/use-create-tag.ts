/**
 * Mutation tạo mới thẻ phân loại.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { tagService } from "../services/tag.service";
import type { TagCreateInput } from "../types/tag.types";

const INVALIDATE = [novelKeys.tag.all, novelKeys.novel.all];

/**
 * Hook mutation tạo mới thẻ.
 *
 * @returns Mutation tạo thẻ.
 */
export function useCreateTag() {
  return useResourceMutation({
    mutationFn: (input: TagCreateInput) => tagService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
