/**
 * Mutation tạo mới tiểu thuyết.
 */

import { useResourceMutation } from "@/shares/hooks/use-resource-mutation";

import { novelKeys } from "../constants/query-keys";
import { novelService } from "../services/novel.service";
import type { NovelCreateInput } from "../types/novel.types";

const INVALIDATE = [novelKeys.novel.all];

/**
 * Hook mutation tạo mới tiểu thuyết.
 *
 * @returns Mutation tạo tiểu thuyết.
 */
export function useCreateNovel() {
  return useResourceMutation({
    mutationFn: (input: NovelCreateInput) => novelService.create(input),
    invalidate: INVALIDATE,
    toastError: false,
  });
}
